import type { Result } from "../lib/result";
import type { EventError } from "./errors";
import type { RSVP } from "./Event";

export interface IRSVPRepository {
  countGoingByEvent(eventId: string): Promise<Result<number, EventError>>;
  getRSVPByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<Result<RSVP | null, EventError>>;
}