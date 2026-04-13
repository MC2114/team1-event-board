import { UserRole } from "../auth/User";
import { Result } from "../lib/result";
import { RsvpError } from "./errors";
import { RSVP } from "./RsvpTypes";

export interface IRsvService {
    getRSVPsByUser(userId: string): Result<RSVP[], never>;
    getRSVPsByEvent(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Result<RSVP[], RsvpError>;
    toggleRSVP(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
    ): Result<RSVP, RsvpError>;
    getAttendeeCount(eventId: string): Result<number, RsvpError>;
}