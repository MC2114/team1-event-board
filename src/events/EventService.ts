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

const VALID_CATEGORIES = [
  "social",
  "educational",
  "volunteer",
  "sports",
  "arts",
  "other",
] as const;

function validateCreateEvent(data: {
  title: string;
  description: string;
  location: string;
  category: string;
  capacity: number | null;
  startDatetime: Date;
  endDatetime: Date;
}): InvalidInputError | null {
  if (!data.title.trim()) {
    return new InvalidInputError("Title is required.");
  }
  if (!data.description.trim()) {
    return new InvalidInputError("Description is required.");
  }
  if (!data.location.trim()) {
    return new InvalidInputError("Location is required.");
  }
  if (!VALID_CATEGORIES.includes(data.category as (typeof VALID_CATEGORIES)[number])) {
    return new InvalidInputError(
      `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`
    );
  }
  if (isNaN(data.startDatetime.getTime())) {
    return new InvalidInputError("Start date and time is invalid.");
  }
  if (isNaN(data.endDatetime.getTime())) {
    return new InvalidInputError("End date and time is invalid.");
  }
  if (data.endDatetime <= data.startDatetime) {
    return new InvalidInputError("End date and time must be after start date and time.");
  }
  if (data.capacity !== null && (data.capacity < 1 || !Number.isInteger(data.capacity))) {
    return new InvalidInputError("Capacity must be a positive whole number.");
  }
  return null;
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
    if (actingUserRole === "user") {
      return Err(new NotAuthorizedError("Only organizers and admins can create events."));
    }

    const validationError = validateCreateEvent(data);
    if (validationError) {
      return Err(validationError);
    }

    const event = repo.create({
      ...data,
      organizerId: actingUserId,
    });

    return Ok(event);
  }

  return { createEvent };
}