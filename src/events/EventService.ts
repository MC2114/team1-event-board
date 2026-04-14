import { Ok, Err, Result } from "../lib/result";
import { InvalidInputError, NotAuthorizedError } from "../errors";
import type { IEventRepository } from "./EventRepository";
import type { Event } from "./Event";
import type { UserRole } from "../auth/User";

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
  ): Result<Event, InvalidInputError | NotAuthorizedError>;
}

export function CreateEventService(repo: IEventRepository): IEventService {
  function createEvent(
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
  ): Result<Event, InvalidInputError | NotAuthorizedError> {
    const event = repo.create({
      ...data,
      organizerId: actingUserId,
    });

    return Ok(event);
  }

  return { createEvent };
}