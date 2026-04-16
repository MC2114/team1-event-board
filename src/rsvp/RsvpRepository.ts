import { Result } from "../lib/result";
import type { RSVP, RSVPWithEvent } from "./RSVP";
import type { RSVPError } from "./errors.ts"

export interface IRSVPRepository {
    findByUser(userId: string): Promise<Result<RSVPWithEvent[], RSVPError>>;
    findByEventId(eventId: string): Promise<Result<RSVP[], RSVPError>>;
    findByUserAndEvent(userId: string, eventId: string): Promise<Result<RSVP | null, RSVPError>>;
    countGoing(eventId: string): Promise<Result<number, RSVPError>>;
    save(rsvp: RSVP): Promise<Result<RSVP, RSVPError>>;
}
