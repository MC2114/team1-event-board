import type { PrismaClient } from "@prisma/client";
import { Ok, Err, type Result } from "../lib/result";
import type {Event, EventStatus, EventFilters} from "./Event";
import type {IEventRepository} from "./EventRepository";
import { UnexpectedDependencyError, type EventError } from "./errors";

function toEvent(record: any): Event {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    location: record.location,
    category: record.category,
    status: record.status,
    capacity: record.capacity,
    startDatetime: record.startDatetime,
    endDatetime: record.endDatetime,
    organizerId: record.organizerId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class PrismaEventRepository implements IEventRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findById(eventId: string): Promise<Result<Event | null, EventError>> {
        try {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        return Ok(event ? toEvent(event) : null);
        } catch {
        return Err(UnexpectedDependencyError("Unable to find event."));
        }
    }

    async findByOrganizer(organizerId: string): Promise<Result<Event[], EventError>> {
        throw new Error("Not implemented");
    }

    async findAll(): Promise<Result<Event[], EventError>> {
        throw new Error("Not implemented");
    }
    
    async findPublishedUpcoming(filters?: EventFilters): Promise<Result<Event[], EventError>> {
        throw new Error("Not implemented");
    }

    async create(event: Event): Promise<Result<Event, EventError>> {
        throw new Error("Not implemented");
    }

    async update(event: Event): Promise<Result<Event | null, EventError>> {
        throw new Error("Not implemented");
    }

    async updateStatus(eventId: string, status: EventStatus): Promise<Result<Event | null, EventError>> {
        throw new Error("Not implemented");
    }
}