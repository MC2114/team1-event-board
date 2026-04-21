import { UserRole } from "../auth/User";
import { Err, Result, Ok } from "../lib/result";
import { ILoggingService } from "../service/LoggingService";
import { EventNotFoundError, InvalidRSVPError, NotAuthorizedError, RSVPError } from "./errors";
import { IRSVPRepository } from "./RsvpRepository";
import { RSVP, RSVPAttendee, RSVPWithEvent } from "./RSVP";
import { IEventRepository } from "../events/EventRepository";
import { EventError } from "../events/errors";

export interface IAttendeeGroups {
    going: RSVPAttendee[];
    waitlisted: RSVPAttendee[];
    cancelled: RSVPAttendee[];
}

export interface IRsvpService {
    getRSVPsByUser(userId: string): Promise<Result<RSVPWithEvent[], RSVPError>>;
    getRSVPsByEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<IAttendeeGroups, RSVPError | EventError>>;
    toggleRSVP(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP, RSVPError | EventError>>;
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
        const result = await this.rsvpRepo.findByUser(userId);
        if (!result.ok) return result;
        const sorted = [...result.value].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        return Ok(sorted);
    }

    async getRSVPsByEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<IAttendeeGroups, RSVPError | EventError>> {
        const eventResult = await this.eventRepo.findById(eventId);

        if (eventResult.ok === false) {
            return Err(InvalidRSVPError("Unable to verify event."));
        }

        const event = eventResult.value;

        if (!event) {
            return Err(EventNotFoundError(`Event ${eventId} not found`));
        }

        if (actingUserRole === "user") {
            return Err(NotAuthorizedError("Users cannot view attendee lists"));
        }

        if (actingUserRole === "staff" && event.organizerId !== actingUserId) {
            return Err(NotAuthorizedError("Staff can only view attendees for their own events"));
        }

        this.logger.info(`Fetching RSVPs for event ${eventId}`);
        const rsvpsResult = await this.rsvpRepo.findAttendeesByEventId(eventId);

        if (rsvpsResult.ok === false) {
            return Err(rsvpsResult.value);
        }

        const grouped: IAttendeeGroups = {
            going: [],
            waitlisted: [],
            cancelled: [],
        };

        for (const rsvp of rsvpsResult.value) {
            grouped[rsvp.status].push(rsvp);
        }

        return Ok(grouped);
    }

    async toggleRSVP(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP, RSVPError | EventError>> {
        if (actingUserRole === "staff" || actingUserRole === "admin") {
            return Err(InvalidRSVPError("Organizers and admins cannot RSVP to events"));
        }

        const eventResult = await this.eventRepo.findById(eventId);

        if (eventResult.ok === false) {
            return Err(InvalidRSVPError("Unable to verify event."))
        }

        const event = eventResult.value;

        if (!event) {
            return Err(EventNotFoundError(`Event ${eventId} not found`));
        }

        if (event.status === "cancelled" || event.status === "past") {
            return Err(InvalidRSVPError("Cannot RSVP to a cancelled or past event"));
        }

        const existingResult = await this.rsvpRepo.findByUserAndEvent(actingUserId, eventId);

        if (existingResult.ok === false) {
            return Err(existingResult.value);
        }

        const existing = existingResult.value;

        if (existing !== null && (existing.status === "going" || existing.status === "waitlisted")) {
            const updated: RSVP = {
                id: existing.id,
                eventId: existing.eventId,
                userId: existing.userId,
                status: "cancelled",
                createdAt: existing.createdAt,
            };

            const saveResult = await this.rsvpRepo.save(updated);

            if (saveResult.ok === false) {
                return Err(saveResult.value);
            }

            this.logger.info(`User ${actingUserId} cancelled RSVP for event ${eventId}`);
            return Ok(updated);
        }

        const countResult = await this.rsvpRepo.countGoing(eventId);

        if (countResult.ok === false) {
            return Err(countResult.value);
        }

        const isFull = event.capacity !== null && countResult.value >= event.capacity;
        const newStatus = isFull ? "waitlisted" : "going";

        const rsvp: RSVP =
            existing !== null
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

        const saveResult = await this.rsvpRepo.save(rsvp);

        if (saveResult.ok === false) {
            return Err(saveResult.value);
        }

        this.logger.info(`User ${actingUserId} RSVP'd ${newStatus} for event ${eventId}`);
        return Ok(rsvp);
    }

    async getAttendeeCount(eventId: string): Promise<Result<number, RSVPError>> {
        const eventResult = await this.eventRepo.findById(eventId);

        if (eventResult.ok === false) {
            return Err(InvalidRSVPError("Unable to verify event."));
        }

        const event = eventResult.value;

        if (!event) {
            return Err(EventNotFoundError(`Event ${eventId} not found`));
        }

        return await this.rsvpRepo.countGoing(eventId);
    }
}

export function CreateRsvpService(
    rsvpRepo: IRSVPRepository,
    eventRepo: IEventRepository,
    logger: ILoggingService,
): IRsvpService {
    return new RsvpService(rsvpRepo, eventRepo, logger);
}
