import { Err, Ok, type Result } from "../lib/result";
import type { Event, EventCategory, EventTimeframe, EventStatus } from "./Event";
import type { EventFilters, IEventRepository } from "./EventRepository";
import { EventError, UnexpectedDependencyError } from "./errors";

const now = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;

const DEMO_EVENTS: Event[] = [
    {
      id: "event-published-1",
      title: "Spring Tech Meetup",
      description: "A community gathering for tech enthusiasts in the Boston area.",
      location: "Boston, MA",
      category: "technology",
      status: "published",
      capacity: 50,
      startDatetime: new Date(now.getTime() + 3 * DAY_MS),
      endDatetime: new Date(now.getTime() + 3 * DAY_MS + 90 * 60 * 1000),
      organizerId: "user-staff",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "event-published-2",
      title: "Weekend Hiking Trip",
      description: "Casual hiking through the Blue Hills Reservation.",
      location: "Milton, MA",
      category: "sports",
      status: "published",
      capacity: 20,
      startDatetime: new Date(now.getTime() + 5 * DAY_MS),
      endDatetime: new Date(now.getTime() + 5 * DAY_MS + 4 * 60 * 60 * 1000),
      organizerId: "user-staff",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "event-draft-1",
      title: "Networking Breakfast",
      description: "An upcoming networking event — not yet published.",
      location: "Cambridge, MA",
      category: "networking",
      status: "draft",
      capacity: 30,
      startDatetime: new Date(now.getTime() + 10 * DAY_MS),
      endDatetime: new Date(now.getTime() + 10 * DAY_MS + 2 * 60 * 60 * 1000),
      organizerId: "user-staff",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

class InMemoryEventRepository implements IEventRepository {
    private readonly events: Event[] = [];

    constructor(events: Event[]) {
        this.events = events;
    }

    async findById(eventId: string): Promise<Result<Event | null, EventError>> {
        try {
            const event = this.events.find((e) => e.id === eventId) ?? null;
            return Ok(event ? event : null);
        } catch {
            return Err(UnexpectedDependencyError("Unable to find the event."));
        }
    }

    async findPublishedUpcoming(filters?: EventFilters): Promise<Result<Event[], EventError>> {
        try {
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
        } catch {
            return Err(UnexpectedDependencyError("Unable to find the events."));
        }
    }

    async findAll(): Promise<Result<Event[], EventError>> {
        try {
            return Ok(this.events);
        } catch {
            return Err(UnexpectedDependencyError("Unable to find the events."));
        }
    }

    async create(event: Event): Promise<Result<Event, EventError>> {
        try {
            this.events.push(event);
            return Ok(event);
        } catch {
            return Err(UnexpectedDependencyError("Unable to create the event."));
        }
    }

    async updateStatus(eventId: string, status: EventStatus): Promise<Result<Event | null, EventError>> {
        try {
            const event = this.events.find((e) => e.id === eventId);
            if (!event){
                return Ok(null);
            }
            event.status = status;
            event.updatedAt = new Date();
            return Ok(event);
        } catch {
            return Err(UnexpectedDependencyError("Unable to update the event status."));
        }
    }
}

function CreateInMemoryEventRepository(): IEventRepository {
    return new InMemoryEventRepository([...DEMO_EVENTS]);
}