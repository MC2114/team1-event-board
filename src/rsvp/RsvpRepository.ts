import { Result } from "../lib/result";
import type { RSVP, RSVPWithEvent, Event } from "./RsvpTypes";
import type { RsvpError } from "./errors.ts"

export interface IRsvpRepository {
  findByUser(userId: string): Promise<Result<RSVPWithEvent[], RsvpError>>;
  findByEvent(eventId: string): Promise<Result<RSVP[], RsvpError>>;
  findByUserAndEvent(userId: string, eventId: string): Promise<Result<RSVP | null, RsvpError>>;
  findEventById(eventId: string): Promise<Result<Event | null, RsvpError>>;
  countGoing(eventId: string): Promise<Result<number, RsvpError>>;
  save(rsvp: RSVP): Promise<Result<RSVP, RsvpError>>;
}