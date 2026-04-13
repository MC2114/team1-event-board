import { Err, Ok, type Result } from "../lib/result";
import type { Event, EventCategory, EventTimeframe, EventStatus } from "./Event";
import type { EventFilters, IEventRepository } from "./EventRepository";
import { EventNotFound, EventError } from "./errors";

class InMemoryEventRepository implements IEventRepository {
    private readonly events: Event[] = [];

    constructor(events: Event[]) {
        this.events = events;
    }

    async findById(eventId: string): Promise<Result<Event | null, EventError>> {
        const event = this.events.find((e) => e.id === eventId) ?? null;
        return Ok(event ? event : null);
    }

    async findPublishedUpcoming(filters?: EventFilters): Promise<Result<Event[], EventError>> {
        const now = new Date();
        let results: Event[] = this.events.filter((e) => e.status === "published" && e.startDatetime > now);

        if (filters?.category) {
            results = results.filter((e) => e.category === filters.category);
        }

        if (filters?.timeframe && filters.timeframe !== "all") {
            const timeframe = filters.timeframe;
            const cutoffDate = new Date(now);

            if (timeframe === "this_week") {
                cutoffDate.setDate(now.getDate() + 7);
            } else if (timeframe === "this_month") {
                cutoffDate.setMonth(now.getMonth() + 1);
            } else if (timeframe === "this_year") {
                cutoffDate.setFullYear(now.getFullYear() + 1);
            }

            results = results.filter((e) => e.startDatetime <= cutoffDate);
        }

        return Ok(results);
    }

    async findAll(): Promise<Result<Event[], EventError>> {
        return Ok(this.events);
    }

    async create(event: Event): Promise<Result<Event, EventError>> {
        this.events.push(event);
        return Ok(event);
    }

    async updateStatus(eventId: string, status: EventStatus): Promise<Result<Event, EventError>> {
        
    }
}

function CreateInMemoryEventRepository(): IEventRepository {
    return new InMemoryEventRepository([]);
}