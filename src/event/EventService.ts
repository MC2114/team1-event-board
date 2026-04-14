import { Err, Ok, type Result } from "../lib/result";
import type { IEventRecord } from "./Event";
import type { IEventRepository } from "./EventRepository";
import { InvalidInputError, type EventError } from "./errors";

export interface IListEventsFilters {
  category?: string;
  timeframe?: "all" | "this_week" | "this_month" | "this_year";
  searchQuery?: string;
}

export interface IEventService {
  listEvents(filters?: IListEventsFilters): Promise<Result<IEventRecord[], EventError>>;
}

class EventService implements IEventService {
  private static readonly validTimeframes = new Set([
    "all",
    "this_week",
    "this_month",
    "this_year",
  ]);

  constructor(private readonly events: IEventRepository) {}

  async listEvents(
    filters: IListEventsFilters = {},
  ): Promise<Result<IEventRecord[], EventError>> {
    if (
      filters.timeframe !== undefined &&
      !EventService.validTimeframes.has(filters.timeframe)
    ) {
      return Err(InvalidInputError("Invalid timeframe filter."));
    }

    const publishedUpcoming = await this.events.listPublishedUpcoming();
    const searchQuery = (filters.searchQuery ?? "").trim().toLowerCase();

    if (!searchQuery) {
      return Ok(publishedUpcoming);
    }

    const filtered = publishedUpcoming.filter((event) => {
      const title = event.title.toLowerCase();
      const description = event.description.toLowerCase();
      const location = event.location.toLowerCase();

      return (
        title.includes(searchQuery) ||
        description.includes(searchQuery) ||
        location.includes(searchQuery)
      );
    });

    return Ok(filtered);
  }
}

export function CreateEventService(events: IEventRepository): IEventService {
  return new EventService(events);
}
