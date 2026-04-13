import { Err, Ok, type Result } from "../lib/result";
import type { EventError } from "./errors";
import type { Event, EventCategory, EventTimeframe, EventStatus } from "./Event";
import type { EventFilters, IEventRepository } from "./EventRepository";

export interface IEventService {
   listEvents(filters?: EventFilters): Promise<Result<Event[], EventError>>;
}

class EventService implements IEventService {
    constructor(private readonly eventRepository: IEventRepository) {}
}