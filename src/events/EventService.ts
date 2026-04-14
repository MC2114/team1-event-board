import { Err, Ok, type Result } from "../lib/result";
import type { UserRole } from "../auth/User";
import type { Event, EventDetailView } from "./Event";
import type { EventError } from "./errors";
import { EventNotFoundError, NotAuthorizedError, UnexpectedDependencyError } from "./errors";
import type { IEventRepository } from "./EventRepository";
import type { IRsvpRepository } from "../rsvp/RsvpRepository";

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
}

export function CreateEventService(
    eventRepository: IEventRepository,
    rsvpRepository: IRsvpRepository,
): IEventService {
    return new EventService(eventRepository, rsvpRepository);
}