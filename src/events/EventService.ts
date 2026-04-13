import { Err, Ok, type Result } from "../lib/result";
import {EventError, InvalidInputError } from "./errors";
import { Event, EventCategory, EventTimeframe, VALID_CATEGORIES, VALID_TIMEFRAMES } from "./Event";
import type { EventFilters, IEventRepository } from "./EventRepository";

export interface IEventService {
   listEvents(filters?: EventFilters): Promise<Result<Event[], EventError>>;
}

class EventService implements IEventService {
    constructor(private readonly eventRepository: IEventRepository) {}

    async listEvents(filters?: EventFilters): Promise<Result<Event[], EventError>> {
        const category = filters?.category;
        const timeframe = filters?.timeframe;

        if (category && !VALID_CATEGORIES.includes(category)) {
            return Err(InvalidInputError("Invalid category"));
        }
        if (timeframe && !VALID_TIMEFRAMES.includes(timeframe)) {
            return Err(InvalidInputError("Invalid timeframe"));
        }

        return this.eventRepository.findPublishedUpcoming(filters);
    }
}

export function CreateEventService(eventRepository: IEventRepository): IEventService {
    return new EventService(eventRepository);
}