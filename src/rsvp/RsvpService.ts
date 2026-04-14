import { UserRole } from "../auth/User";
import { Err, Result, Ok } from "../lib/result";
import { ILoggingService } from "../service/LoggingService";
import { EventNotFound, InvalidRsvp, NotAuthorized, RsvpError } from "./errors";
import { RSVP, RSVPWithEvent } from "./RsvpTypes";

export interface IRsvpService {
    getRSVPsByUser(userId: string): Promise<Result<RSVPWithEvent[], RsvpError>>;
    getRSVPsByEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP[], RsvpError>>;
    toggleRSVP(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<RSVP, RsvpError>>;
    getAttendeeCount(eventId: string): Promise<Result<number, RsvpError>>;
}

class RsvpService implements IRsvpService {
    constructor(
        private readonly repo: any, // IRsvpRepository
        private readonly logger: ILoggingService,
    ) { }

    async getRSVPsByUser(userId: string): Promise<Result<RSVPWithEvent[], RsvpError>> {
        this.logger.info(`Fetching RSVPs for user ${userId}`);
        return this.repo.findByUser(userId);
    }

    async getRSVPsByEvent(eventId: string, actingUserId: string, actingUserRole: UserRole): Promise<Result<RSVP[], RsvpError>> {
        const event = this.repo.findEventById(eventId);
        if (!event) {
            return Err(EventNotFound(`Event ${eventId} not found`));
        }

        if (actingUserRole === "user") {
            return Err(NotAuthorized("Users cannot view attendee lists"));
        }

        if (actingUserRole === "staff" && event.organizerId !== actingUserId) {
            return Err(NotAuthorized("Staff can only view attendees for their own events"))
        }

        this.logger.info(`Fetching RSVPs for event ${eventId}`);
        return this.repo.findEventById(eventId);
    }

    async toggleRSVP(eventId: string, actingUserId: string, actingUserRole: UserRole): Promise<Result<RSVP, RsvpError>> {
        if (actingUserRole === "staff" || actingUserRole === "admin") {
            return Err(InvalidRsvp("Organizers and admins cannot RSVP to events"))
        }

        const event = this.repo.findEventById(eventId);
        if (!event) {
            return Err(EventNotFound(`Event ${eventId} not found`));
        }

        if (event.status === "cancelled" || event.status === "past") {
            return Err(InvalidRsvp("Cannot RSVP to a cancelled or past event"))
        }

        const existing = this.repo.findByUserAndEvent(actingUserId, eventId);
        if (existing && (existing.status === "going" || existing.status === "waitlisted")) {
            const updated: RSVP = {
                id: existing.id,
                eventId: existing.eventId,
                userId: existing.userId,
                status: "cancelled",
                createdAt: existing.createdAt,
            };
            this.repo.save(updated)
            this.logger.info(`User ${actingUserId} cancelled RSVP for event ${eventId}`);
            return Ok(updated)
        }

        const goingCount = this.repo.countGoing(eventId);
        const isFull = event.capacity !== null && goingCount >= event.capacity;
        const newStatus = isFull ? "waitlisted" : "going";

        const rsvp: RSVP = existing ? {
            id: existing.id,
            eventId: existing.eventId,
            userId: existing.userId,
            status: newStatus,
            createdAt: existing.createdAt,
        } : {
            id: `rsvp-${Date.now()}`,
            eventId,
            userId: actingUserId,
            status: newStatus,
            createdAt: new Date(),
        };

        this.repo.save(rsvp);
        this.logger.info(`User ${actingUserId} RSVP'd ${newStatus} for event ${eventId}`);
        return Ok(rsvp);
    }

    async getAttendeeCount(eventId: string): Promise<Result<number, RsvpError>> {
        const event = this.repo.findEventById(eventId);
        if (!event) {
            return Err(EventNotFound(`Event ${eventId} not found`))
        }
        return Ok(this.repo.countGoing(eventId));
    }
}

export function CreateRsvpService(
    repo: any, // TBD: IRsvpRepository
    logger: ILoggingService,
): IRsvpService {
    return new RsvpService(repo, logger)
}