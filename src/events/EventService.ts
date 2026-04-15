import { Err, Ok, type Result } from "../lib/result";
import type { UserRole } from "../auth/User";
import {
    isEventCategory,
    isEventTimeframe,
    type Event,
    type EventCategory,
    type EventDetailView,
    type EventFilters,
    type EventStatus,
    type EventTimeframe,
} from "./Event";
import type { EventError } from "./errors";
import {
    EventNotFoundError,
    InvalidEventStateError,
    InvalidInputError,
    NotAuthorizedError,
    UnexpectedDependencyError,
} from "./errors";
import type { IEventRepository } from "./EventRepository";
import type { IRSVPRepository } from "../rsvp/RsvpRepository";
import { randomUUID } from "node:crypto";

export interface IListEventsFilters {
    category?: EventCategory;
    timeframe?: EventTimeframe;
    searchQuery?: string;
}

export interface IEventService {
    getEventById(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<Event, EventError>>;
    getEventDetailView(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<EventDetailView, EventError>>;
    createEvent(
        actingUserId: string,
        actingUserRole: UserRole,
        data: {
            title: string;
            description: string;
            location: string;
            category: string;
            capacity: number | null;
            startDatetime: Date;
            endDatetime: Date;
        },
    ): Promise<Result<Event, EventError>>;
    updateEventStatus(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
        newStatus: EventStatus,
    ): Promise<Result<Event, EventError>>;
    getAllEventsForManager(
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<Event[], EventError>>;
    updateEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
        data: Partial<{
            title: string;
            description: string;
            location: string;
            category: string;
            capacity: number | null;
            startDatetime: Date;
            endDatetime: Date;
        }>
    ): Promise<Result<Event, EventError>>;
    listEvents(filters?: IListEventsFilters): Promise<Result<Event[], EventError>>;
}

class EventService implements IEventService {
    private static includesSearchMatch(event: Event, searchQuery: string): boolean {
        const title = event.title.toLowerCase();
        const description = event.description.toLowerCase();
        const location = event.location.toLowerCase();

        return (
            title.includes(searchQuery) ||
            description.includes(searchQuery) ||
            location.includes(searchQuery)
        );
    }

    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly rsvpRepository: IRSVPRepository,
    ) { }

    async getEventById(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<Event, EventError>> {
        const eventResult = await this.eventRepository.findById(eventId);

        if (!eventResult.ok) {
            return eventResult;
        }

        const event = eventResult.value;

        if (event === null) {
            return Err(EventNotFoundError("No event exists with the given ID."));
        }

        if (actingUserRole === "admin") {
            return Ok(event);
        }

        if (actingUserRole === "staff") {
            const canView =
                event.status === "published" ||
                (event.status === "draft" && event.organizerId === actingUserId);
            if (canView) {
                return Ok(event);
            }
            return Err(NotAuthorizedError("You are not authorized to view this event."));
        }

        if (actingUserRole === "user") {
            const canView = event.status === "published";
            if (canView) {
                return Ok(event);
            }
            return Err(NotAuthorizedError("You are not authorized to view this event."));
        }
        return Err(NotAuthorizedError("You are not authorized to view this event."));
    }

    async getEventDetailView(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<EventDetailView, EventError>> {
        const eventResult = await this.getEventById(eventId, actingUserId, actingUserRole);

        if (eventResult.ok === false) {
            return Err(eventResult.value);
        }
        const event = eventResult.value;
        const attendeeCountResult = await this.rsvpRepository.countGoing(eventId);

        if (!attendeeCountResult.ok) {
            const error = attendeeCountResult.value;
            const message =
                typeof error === "object" && error !== null && "message" in error
                    ? error.message
                    : "Unknown RSVP error";

            return Err(UnexpectedDependencyError(message));
        }

        return Ok({
            event: event,
            attendeeCount: attendeeCountResult.value,
        });
    }

    async createEvent(
        actingUserId: string,
        actingUserRole: UserRole,
        data: {
            title: string;
            description: string;
            location: string;
            category: string;
            capacity: number | null;
            startDatetime: Date;
            endDatetime: Date;
        },
    ): Promise<Result<Event, EventError>> {
        if (actingUserRole === "user") {
            return Err(NotAuthorizedError("Only organizers and admins can create events."));
        }

        if (!data.title.trim()) {
            return Err(InvalidInputError("Title is required."));
        }
        if (!data.description.trim()) {
            return Err(InvalidInputError("Description is required."));
        }
        if (!data.location.trim()) {
            return Err(InvalidInputError("Location is required."));
        }
        if (!data.category.trim()) {
            return Err(InvalidInputError("Category is required."));
        }
        if (isNaN(data.startDatetime.getTime())) {
            return Err(InvalidInputError("Start date and time is invalid."));
        }
        if (isNaN(data.endDatetime.getTime())) {
            return Err(InvalidInputError("End date and time is invalid."));
        }
        if (data.endDatetime <= data.startDatetime) {
            return Err(InvalidInputError("End date and time must be after start date and time."));
        }
        if (data.capacity !== null && (data.capacity < 1 || !Number.isInteger(data.capacity))) {
            return Err(InvalidInputError("Capacity must be a positive whole number."));
        }

        const now = new Date();
        const event: Event = {
            id: randomUUID(),
            ...data,
            organizerId: actingUserId,
            status: "draft",
            createdAt: now,
            updatedAt: now,
        };

        return await this.eventRepository.create(event);
    }

    async updateEventStatus(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
        newStatus: EventStatus,
    ): Promise<Result<Event, EventError>> {
        const result = await this.eventRepository.findById(eventId);

        if (!result.ok) {
            return result;
        }

        const event = result.value;

        if (!event) {
            return Err(EventNotFoundError("No event exists with the given ID."));
        }

        const isOwner = actingUserRole === "staff" && event.organizerId === actingUserId;
        const isAdmin = actingUserRole === "admin";

        if (!isOwner && !isAdmin) {
            return Err(NotAuthorizedError("You are not authorized to update the event status."));
        }

        if (newStatus !== "published" && newStatus !== "cancelled") {
            return Err(
                InvalidEventStateError(
                    `Invalid target status "${newStatus}". Only "published" or "cancelled" are allowed.`,
                ),
            );
        }

        const isDraftToPublished = event.status === "draft" && newStatus === "published";
        const isPublishedToCancelled = event.status === "published" && newStatus === "cancelled";

        if (!isDraftToPublished && !isPublishedToCancelled) {
            return Err(
                InvalidEventStateError(
                    `Invalid status transition from "${event.status}" to "${newStatus}".`,
                ),
            );
        }

        const updateResult = await this.eventRepository.updateStatus(eventId, newStatus);

        if (updateResult.ok === false) {
            return updateResult;
        }

        const updated = updateResult.value;
        if (!updated) {
            return Err(EventNotFoundError("No event exists with the given ID."));
        }

        return Ok(updated);
    }

    async getAllEventsForManager(
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<Event[], EventError>> {
        if (actingUserRole === "user") {
            return Err(NotAuthorizedError("You are not authorized to view all events."));
        }

        const result = await this.eventRepository.findAll();

        if (result.ok === false) {
            return result;
        }

        if (actingUserRole === "admin") {
            return Ok(result.value);
        }

        const staffEvents = result.value.filter((event) => event.organizerId === actingUserId);
        return Ok(staffEvents);
    }

    async updateEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
        data: Partial<{
            title: string;
            description: string;
            location: string;
            category: string;
            capacity: number | null;
            startDatetime: Date;
            endDatetime: Date;
        }>,
    ): Promise<Result<Event, EventError>> {
        const findResult = await this.eventRepository.findById(eventId);
        if (!findResult.ok) {
            return findResult;
        }

        const existing = findResult.value;
        if (!existing) {
            return Err(EventNotFoundError("Event not found."));
        }

        if (actingUserRole !== "admin" && existing.organizerId !== actingUserId) {
            return Err(NotAuthorizedError("You do not have permission to edit this event."));
        }

        if (existing.status === "cancelled" || existing.status === "past") {
            return Err(InvalidEventStateError("Cancelled or past events cannot be edited."));
        }

        if (data.title !== undefined && !data.title.trim()) {
            return Err(InvalidInputError("Title is required."));
        }
        if (data.description !== undefined && !data.description.trim()) {
            return Err(InvalidInputError("Description is required."));
        }
        if (data.location !== undefined && !data.location.trim()) {
            return Err(InvalidInputError("Location is required."));
        }
        if (data.category !== undefined && !data.category.trim()) {
            return Err(InvalidInputError("Category is required."));
        }
        if (data.startDatetime !== undefined && isNaN(data.startDatetime.getTime())) {
            return Err(InvalidInputError("Start date and time is invalid."));
        }
        if (data.endDatetime !== undefined && isNaN(data.endDatetime.getTime())) {
            return Err(InvalidInputError("End date and time is invalid."));
        }
        if (data.startDatetime && data.endDatetime && data.endDatetime <= data.startDatetime) {
            return Err(InvalidInputError("End date and time must be after start date and time."));
        }
        if (
            data.capacity !== undefined &&
            data.capacity !== null &&
            (data.capacity < 1 || !Number.isInteger(data.capacity))
        ) {
            return Err(InvalidInputError("Capacity must be a positive whole number."));
        }

        const merged = { ...existing, ...data };
        const updateResult = await this.eventRepository.update({ ...merged, updatedAt: new Date() });

        if (!updateResult.ok) {
            return updateResult;
        }

        if (!updateResult.value) {
            return Err(EventNotFoundError("Event could not be updated."));
        }

        return Ok(updateResult.value);
    }

    async listEvents(filters: IListEventsFilters = {}): Promise<Result<Event[], EventError>> {
        const normalizedCategory = filters.category?.trim() || undefined;
        const normalizedTimeframe = filters.timeframe?.trim() || undefined;
        let categoryFilter: EventCategory | undefined;
        let timeframeFilter: EventTimeframe | undefined;

        if (normalizedCategory !== undefined) {
            if (!isEventCategory(normalizedCategory)) {
                return Err(InvalidInputError("Invalid category filter."));
            }
            categoryFilter = normalizedCategory;
        }

        if (normalizedTimeframe !== undefined) {
            if (!isEventTimeframe(normalizedTimeframe)) {
                return Err(InvalidInputError("Invalid timeframe filter."));
            }
            timeframeFilter = normalizedTimeframe;
        }

        const repositoryFilters: EventFilters = {};

        if (categoryFilter !== undefined) {
            repositoryFilters.category = categoryFilter;
        }
        if (timeframeFilter !== undefined) {
            repositoryFilters.timeframe = timeframeFilter;
        }

        const repositoryResult = await this.eventRepository.findPublishedUpcoming(
            Object.keys(repositoryFilters).length > 0 ? repositoryFilters : undefined,
        );

        if (repositoryResult.ok === false) {
            return repositoryResult;
        }

        const searchQuery = (filters.searchQuery ?? "").trim().toLowerCase();
        if (searchQuery.length === 0) {
            return Ok(repositoryResult.value);
        }

        const filteredEvents = repositoryResult.value.filter((event) =>
            EventService.includesSearchMatch(event, searchQuery),
        );

        return Ok(filteredEvents);
    }
}

export function CreateEventService(
    eventRepository: IEventRepository,
    rsvpRepository: IRSVPRepository,
): IEventService {
    return new EventService(eventRepository, rsvpRepository);
}
