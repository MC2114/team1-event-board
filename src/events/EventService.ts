import { UserRole } from "../auth/User";
import { Ok, Err, Result } from "../lib/result";
import type { IEventRepository } from "./EventRepository";
import type { IRsvpRepository } from "../rsvp/RsvpRepository";
import {
    EventNotFound,
    NotAuthorized,
    InvalidEventState,
    UnexpectedError,
    type EventError,
} from "./errors";
import type { Event, EventWithAttendeeCount, OrganizerDashboard } from "./EventTypes";
import { ILoggingService } from "../service/LoggingService";

export interface IEventService {
    getEventsByOrganizer(
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<OrganizerDashboard, EventError>>;
    updateEventStatus(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
        newStatus: "published" | "cancelled",
    ): Promise<Result<Event, EventError>>;
}

class EventService implements IEventService {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly rsvpRepo: IRsvpRepository,
        private readonly logger: ILoggingService,
    ) { }

    async getEventsByOrganizer(actingUserId: string, actingUserRole: UserRole): Promise<Result<OrganizerDashboard, EventError>> {
        if (actingUserRole === "user") {
            return Err(NotAuthorized("Members cannot access the organizer dashboard."))
        }

        const eventsResult = actingUserRole === "admin" ? await this.eventRepo.findAll() : await this.eventRepo.findByOrganizer(actingUserId);
        if (eventsResult.ok === false) {
            return Err(eventsResult.value);
        }

        const withCounts: EventWithAttendeeCount[] = [];

        for (const event of eventsResult.value) {
            const countResult = await this.rsvpRepo.countGoing(event.id);
            if (countResult.ok === false) {
                return Err(countResult.value);
            }

            withCounts.push({ event, attendeeCount: countResult.value })
        }

        const dashboard: OrganizerDashboard = {
            published: withCounts
                .filter((e) => e.event.status === "published")
                .sort((a, b) => a.event.startDatetime.getTime() - b.event.startDatetime.getTime()),

            draft: withCounts
                .filter((e) => e.event.status === "draft")
                .sort((a, b) => a.event.startDatetime.getTime() - b.event.startDatetime.getTime()),

            cancelledOrPast: withCounts
                .filter((e) => e.event.status === "cancelled" || e.event.status === "past")
                .sort((a, b) => a.event.startDatetime.getTime() - b.event.startDatetime.getTime()),
        };

        this.logger.info(`Organizer dashboard fetched for user ${actingUserId}`);
        return Ok(dashboard);
    }

    async updateEventStatus(eventId: string, actingUserId: string, actingUserRole: UserRole, newStatus: "published" | "cancelled"): Promise<Result<Event, EventError>> {
        if (actingUserId === "user") {
            return Err(NotAuthorized("Members cannot update event status"))
        }

        const eventResult = await this.eventRepo.findById(eventId);
        if (eventResult.ok === false) {
            return Err(eventResult.value);
        }

        if (!eventResult.value) {
            return Err(EventNotFound(`Event ${eventId} not found.`))
        }

        const event = eventResult.value;
        if (actingUserRole === "staff" && event.organizerId !== actingUserId) {
            return Err(NotAuthorized("Staff can only update their own events."))
        }

        const validTransitions: Record<string, string[]> = {
            draft: ["published"],
            published: ["cancelled"],
        };

        const allowed = validTransitions[event.status] ?? [];
        if (!allowed.includes(newStatus)) {
            return Err(InvalidEventState(`Cannot transition event from ${event.status} to ${newStatus}`))
        }

        const updated: Event = {
            ...event,
            status: newStatus,
            updatedAt: new Date(),
        }

        const saveResult = await this.eventRepo.save(updated);
        if (saveResult.ok === false) {
            return Err(saveResult.value);
        }

        this.logger.info(`Event ${eventId} status updated to ${newStatus} by user ${actingUserId}`)
        return Ok(saveResult.value)
    }
}

export function CreateEventService(
    eventRepo: IEventRepository,
    rsvpRepo: IRsvpRepository,
    logger: ILoggingService,
): IEventService {
    return new EventService(eventRepo, rsvpRepo, logger);
}