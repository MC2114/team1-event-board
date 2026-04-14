
import { Err, Ok, type Result } from "../lib/result";
import type { UserRole } from "../auth/User";
import type { Event, EventDetailView } from "./Event";
import type { EventError } from "./errors";
import { EventNotFoundError, InvalidInputError, InvalidEventStateError, NotAuthorizedError, UnexpectedDependencyError } from "./errors";
import type { IEventRepository } from "./EventRepository";
import type { IRsvpRepository } from "../rsvp/RsvpRepository";
import { randomUUID } from "node:crypto";

export interface IEventService {
    getEventById(eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<Event, EventError>>
    getEventDetailView(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<EventDetailView, EventError>>
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
        }
    ): Promise<Result<Event, EventError>>;
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
}

class EventService implements IEventService {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly rsvpRepository: IRsvpRepository,
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

        if (actingUserRole === 'admin') {
            return Ok(event);
        }

        if (actingUserRole === 'staff') {
            const canView = event.status === "published" || (event.status === "draft" && event.organizerId === actingUserId);
            if (canView) {
                return Ok(event);
            }
            return Err(NotAuthorizedError("You are not authorized to view this event."));
        }

        if (actingUserRole === 'user') {
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
        const eventResult = await this.getEventById(
            eventId,
            actingUserId,
            actingUserRole,
        );

        if (eventResult.ok === false) {
            return Err(eventResult.value);
        }
        const event = eventResult.value;
        const attendeeCountResult = await this.rsvpRepository.countGoing(eventId);

        if (!attendeeCountResult.ok) {
            const error = attendeeCountResult.value
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
        }
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
        }>
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
        if (data.capacity !== undefined && data.capacity !== null && (data.capacity < 1 || !Number.isInteger(data.capacity))) {
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
}

export function CreateEventService(
    eventRepository: IEventRepository,
    rsvpRepository: IRsvpRepository,
): IEventService {
    return new EventService(eventRepository, rsvpRepository);
}