import { UserRole } from "../auth/User";
import { Err, Result, Ok } from "../lib/result";
import { ILoggingService } from "../service/LoggingService";
import type { IEventRepository } from "../events/EventRepository";
import { EventNotFound, InvalidRsvp, NotAuthorized, RSVPError } from "./errors";
import { IRSVPRepository } from "./RsvpRepository";
import { RSVP, RSVPWithEvent } from "./RSVP";

export interface IRsvpService {
    getRSVPsByUser(userId: string): Promise<Result<RSVPWithEvent[], RSVPError>>;
    getRSVPsByEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP[], RSVPError>>;
    toggleRSVP(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP, RSVPError>>;
    getAttendeeCount(eventId: string): Promise<Result<number, RSVPError>>;
}

class RsvpService implements IRsvpService {
    constructor(
        private readonly rsvpRepo: IRSVPRepository,
        private readonly eventRepo: IEventRepository,
        private readonly logger: ILoggingService,
    ) { }

    async getRSVPsByUser(userId: string): Promise<Result<RSVPWithEvent[], RSVPError>> {
        this.logger.info(`Fetching RSVPs for user ${userId}`);
        return this.rsvpRepo.findByUser(userId);
    }

    async getRSVPsByEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP[], RSVPError>> {
        const eventResult = await this.eventRepo.findById(eventId);

        if (eventResult.ok === false) {
            return Err(InvalidRsvp("Unable to verify event."));
        }

        const event = eventResult.value;

        if (event === null) {
            return Err(EventNotFound(`Event ${eventId} not found`));
        }

        if (actingUserRole === "user") {
            return Err(NotAuthorized("Users cannot view attendee lists"));
        }

        if (actingUserRole === "staff" && event.organizerId !== actingUserId) {
            return Err(NotAuthorized("Staff can only view attendees for their own events"));
        }

        this.logger.info(`Fetching RSVPs for event ${eventId}`);
        return await this.rsvpRepo.findByEvent(eventId);
    }

    async toggleRSVP(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP, RSVPError>> {
        if (actingUserRole === "staff" || actingUserRole === "admin") {
            return Err(InvalidRsvp("Organizers and admins cannot RSVP to events"));
        }

        const eventResult = await this.eventRepo.findById(eventId); // was missing await

        if (eventResult.ok === false) {
            return Err(eventResult.value);
        }

        const event = eventResult.value;

        if (!event) {
            return Err(EventNotFound(`Event ${eventId} not found`));
        }

        if (event.status === "cancelled" || event.status === "past") {
            return Err(InvalidRsvp("Cannot RSVP to a cancelled or past event"));
        }

        const existingResult = await this.rsvpRepo.findByUserAndEvent(actingUserId, eventId); // was missing await

        if (existingResult.ok === false) {
            return Err(existingResult.value);
        }

        const existing = existingResult.value;

        if (existing && (existing.status === "going" || existing.status === "waitlisted")) {
            const updated: RSVP = {
                id: existing.id,
                eventId: existing.eventId,
                userId: existing.userId,
                status: "cancelled",
                createdAt: existing.createdAt,
            };

            const saveResult = await this.rsvpRepo.save(updated); // was missing await

            if (saveResult.ok === false) {
                return Err(saveResult.value);
            }

            this.logger.info(`User ${actingUserId} cancelled RSVP for event ${eventId}`);
            return Ok(updated);
        }

        const countResult = await this.rsvpRepo.countGoing(eventId); // was missing await

        if (countResult.ok === false) {
            return Err(countResult.value);
        }

        const isFull = event.capacity !== null && countResult.value >= event.capacity;
        const newStatus = isFull ? "waitlisted" : "going";

        const rsvp: RSVP = existing
            ? {
                id: existing.id,
                eventId: existing.eventId,
                userId: existing.userId,
                status: newStatus,
                createdAt: existing.createdAt,
            }
            : {
                id: `rsvp-${Date.now()}`,
                eventId,
                userId: actingUserId,
                status: newStatus,
                createdAt: new Date(),
            };

        const saveResult = await this.rsvpRepo.save(rsvp); // was missing await

        if (saveResult.ok === false) {
            return Err(saveResult.value);
        }

        this.logger.info(`User ${actingUserId} RSVP'd ${newStatus} for event ${eventId}`);
        return Ok(rsvp);
    }

    async getAttendeeCount(eventId: string): Promise<Result<number, RSVPError>> {
        const eventResult = await this.eventRepo.findById(eventId); // was missing await

        if (eventResult.ok === false) {
            return Err(InvalidRsvp("Unable to verify event."));
        }

        const event = eventResult.value;

        if (event === null) {
            return Err(EventNotFound(`Event ${eventId} not found`));
        }

        return await this.rsvpRepo.countGoing(eventId); // was missing await
    }
}

export function CreateRsvpService(
    rsvpRepo: IRSVPRepository,
    eventRepo: IEventRepository,
    logger: ILoggingService,
): IRsvpService {
    return new RsvpService(rsvpRepo, eventRepo, logger);
}