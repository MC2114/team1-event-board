import type { ICreateEventRecordInput, IEventRecord } from "./Event";
import type { IEventRepository } from "./EventRepository";

class InMemoryEventRepository implements IEventRepository {
  private readonly events = new Map<string, IEventRecord>();

  async create(input: ICreateEventRecordInput): Promise<IEventRecord> {
    const now = new Date();
    const event: IEventRecord = {
      id: input.id,
      title: input.title,
      description: input.description,
      location: input.location,
      category: input.category,
      status: input.status ?? "draft",
      capacity: input.capacity,
      startDatetime: input.startDatetime,
      endDatetime: input.endDatetime,
      organizerId: input.organizerId,
      createdAt: now,
      updatedAt: now,
    };

    this.events.set(event.id, event);
    return { ...event };
  }

  async findById(id: string): Promise<IEventRecord | null> {
    const event = this.events.get(id);
    return event ? { ...event } : null;
  }

  async listAll(): Promise<IEventRecord[]> {
    return [...this.events.values()]
      .map((event) => ({ ...event }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listPublishedUpcoming(now: Date = new Date()): Promise<IEventRecord[]> {
    return [...this.events.values()]
      .filter((event) => event.status === "published" && event.startDatetime.getTime() > now.getTime())
      .map((event) => ({ ...event }))
      .sort((a, b) => a.startDatetime.getTime() - b.startDatetime.getTime());
  }
}

export function CreateInMemoryEventRepository(): IEventRepository {
  return new InMemoryEventRepository();
}
