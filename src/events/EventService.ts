import { Ok, Err } from "../lib/result";
import {
  InvalidInputError,
  NotAuthorizedError,
  type EventError,
} from "./errors";
import type { IEventRepository } from "./EventRepository";
import type { Event } from "./Event";
import type { UserRole } from "../auth/User";
import { randomUUID } from "node:crypto";

export interface IEventService {
  createEvent(
    actingUserId: string,
    actingUserRole: UserRole,
    data: {
      title: string;
      description: string;
      location: string;
      category: string;
      capacity: number | null;
      startDatetime: Date;
      endDatetime: Date;
    }
  ): Promise<import("../lib/result").Result<Event, EventError>>;
}

export function CreateEventService(repo: IEventRepository): IEventService {
  async function createEvent(
    actingUserId: string,
    actingUserRole: UserRole,
    data: {
      title: string;
      description: string;
      location: string;
      category: string;
      capacity: number | null;
      startDatetime: Date;
      endDatetime: Date;
    }
  ): Promise<import("../lib/result").Result<Event, EventError>> {
    if (actingUserRole === "user") {
      return Err(NotAuthorizedError("Only organizers and admins can create events."));
    }

    if (!data.title.trim()) {
      return Err(InvalidInputError("Title is required."));
    }
    if (!data.description.trim()) {
      return Err(InvalidInputError("Description is required."));
    }
    if (!data.location.trim()) {
      return Err(InvalidInputError("Location is required."));
    }
    if (!data.category.trim()) {
      return Err(InvalidInputError("Category is required."));
    }
    if (isNaN(data.startDatetime.getTime())) {
      return Err(InvalidInputError("Start date and time is invalid."));
    }
    if (isNaN(data.endDatetime.getTime())) {
      return Err(InvalidInputError("End date and time is invalid."));
    }
    if (data.endDatetime <= data.startDatetime) {
      return Err(InvalidInputError("End date and time must be after start date and time."));
    }
    if (data.capacity !== null && (data.capacity < 1 || !Number.isInteger(data.capacity))) {
      return Err(InvalidInputError("Capacity must be a positive whole number."));
    }

    const now = new Date();
    const event: Event = {
      id: randomUUID(),
      ...data,
      organizerId: actingUserId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    return await repo.create(event);
  }

  return { createEvent };
}