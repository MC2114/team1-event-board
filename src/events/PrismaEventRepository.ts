import type { PrismaClient } from "@prisma/client";
import type {Ok, Err} from "../lib/result";
import type {Result} from "../lib/result";
import type {Event, EventStatus, EventFilters} from "./Event";
import type {IEventRepository} from "./EventRepository";
import { UnexpectedDependencyError, type EventError } from "./errors";

export class PrismaEventRepository implements IEventRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findById(eventId: string): Promise<Result<Event | null, EventError>> {
        throw new Error("Not implemented");
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