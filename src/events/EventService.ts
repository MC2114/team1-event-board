import { Err, Ok, type Result } from "../lib/result";
import type { UserRole } from "../auth/User";
import {
    VALID_CATEGORIES,
    VALID_TIMEFRAMES,
    type Event,
    type EventCategory,
    type EventDetailView,
    type EventFilters,
    type EventTimeframe,
} from "./Event";
import type { EventError } from "./errors";
import {
    EventNotFoundError,
    InvalidInputError,
    NotAuthorizedError,
    UnexpectedDependencyError,
} from "./errors";
import type { IEventRepository } from "./EventRepository";
import type { IRsvpRepository } from "../rsvp/RsvpRepository";
import { randomUUID } from "node:crypto";

export interface IEventService {
    listEvents(filters?: EventFilters): Promise<Result<Event[], EventError>>;
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
}

class EventService implements IEventService {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly rsvpRepository: IRsvpRepository,
    ) {}

    async listEvents(filters?: EventFilters): Promise<Result<Event[], EventError>> {
        const category = filters?.category;
        const timeframe = filters?.timeframe;

        if (category && !VALID_CATEGORIES.includes(category as EventCategory)) {
            return Err(InvalidInputError("Invalid category"));
        }
        if (timeframe && !VALID_TIMEFRAMES.includes(timeframe as EventTimeframe)) {
            return Err(InvalidInputError("Invalid timeframe"));
        }

        return this.eventRepository.findPublishedUpcoming(filters);
    }

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
}

export function CreateEventService(
    eventRepository: IEventRepository,
    rsvpRepository: IRsvpRepository,
): IEventService {
    return new EventService(eventRepository, rsvpRepository);
}
