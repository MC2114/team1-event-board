import type { Result } from "../lib/result";
import type { EventError } from "./errors";
import type { Event, EventStatus } from "./Event";

export interface IEventRepository {
  findById(eventId: string): Promise<Result<Event | null, EventError>>;
  findAll(): Promise<Result<Event[], EventError>>;
  create(event: Event): Promise<Result<Event, EventError>>;
  update(event: Event): Promise<Result<Event | null, EventError>>;
  updateStatus(eventId: string, status: EventStatus): Promise<Result<Event | null, EventError>>;
}
