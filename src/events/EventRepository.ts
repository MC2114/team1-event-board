import type { Result } from "../lib/result";
import type { EventError } from "./errors";
import type { Event, EventCategory, EventTimeframe, EventStatus } from "./Event";

export interface EventFilters {
    category?: EventCategory;
    timeframe?: EventTimeframe;
}

export interface IEventRepository {
    findById(id: string): Promise<Result<Event | null, EventError>>;
    findPublishedUpcoming(filters?: EventFilters): Promise<Result<Event[], EventError>>;
    findAll(): Promise<Result<Event[], EventError>>;
    create(event: Event): Promise<Result<Event, EventError>>;
    updateStatus(eventId: string, status: EventStatus): Promise<Result<Event, EventError>>;
}