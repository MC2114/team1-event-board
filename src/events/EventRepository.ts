import { Ok, Err, type Result } from "../lib/result";
import { Event } from "./EventTypes";
import { EventError } from "./errors";

export interface IEventRepository {
    findById(eventId: string): Promise<Result<Event | undefined, EventError>>;
    findByOrganizer(organizerId: string): Promise<Result<Event[], EventError>>;
    findAll(): Promise<Result<Event[], EventError>>;
    save(event: Event): Promise<Result<Event, EventError>>;
}