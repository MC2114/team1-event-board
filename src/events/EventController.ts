import type { Request, Response } from "express";
import { getAuthenticatedUser, recordPageView, type AppSessionStore } from "../session/AppSession";
import type { IEventService } from "./EventService";
import type { ILoggingService } from "../service/LoggingService";
import type { IRSVPRepository } from "../rsvp/RsvpRepository";
import type { UserRole } from "../auth/User";
import type { EventError } from "./errors";
import {
  isEventCategory,
  isEventTimeframe,
  type EventCategory,
  type EventTimeframe,
  VALID_CATEGORIES,
  VALID_TIMEFRAMES,
} from "./Event";

export interface IEventController {
  showCreateForm(req: Request, res: Response): void;
  handleCreateForm(req: Request, res: Response): Promise<void>;
  showEventDetail(req: Request, res: Response): Promise<void>;
  showEditForm(req: Request, res: Response): Promise<void>;
  handleEditForm(req: Request, res: Response): Promise<void>;
  listEventsFromQuery(req: Request, res: Response): Promise<void>;
  showEventsList(req: Request, res: Response): Promise<void>;
}

function parseCapacity(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

function parseDate(raw: string): Date {
  return new Date(raw);
}

export class EventController implements IEventController {
  constructor(
    private readonly eventService: IEventService,
    private readonly rsvpRepository: IRSVPRepository,
    private readonly logger: ILoggingService,
  ) {}

  private mapErrorStatus(error: EventError): number {
    if (error.name === "InvalidInputError") return 400;
    if (error.name === "EventNotFoundError") return 404;
    if (error.name === "NotAuthorizedError") return 403;
    if (error.name === "InvalidEventStateError") return 400;
    return 500;
  }

  showCreateForm(req: Request, res: Response): void {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
      res.redirect("/login");
      return;
    }

    if (user.role === "user") {
      res.status(403).render("partials/error", {
        message: "Only organizers and admins can create events.",
        layout: false,
      });
      return;
    }

    res.render("events/create", {
      pageError: null,
      formData: {},
    });
  }

  async handleCreateForm(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
      res.redirect("/login");
      return;
    }

    const rawCapacity =
      typeof req.body.capacity === "string" ? req.body.capacity : "";

    const formData = {
      title: typeof req.body.title === "string" ? req.body.title : "",
      description:
        typeof req.body.description === "string" ? req.body.description : "",
      location:
        typeof req.body.location === "string" ? req.body.location : "",
      category:
        typeof req.body.category === "string" ? req.body.category : "",
      capacity: parseCapacity(rawCapacity),
      startDatetime: parseDate(
        typeof req.body.startDatetime === "string"
          ? req.body.startDatetime
          : ""
      ),
      endDatetime: parseDate(
        typeof req.body.endDatetime === "string"
          ? req.body.endDatetime
          : ""
      ),
    };

    const result = await this.eventService.createEvent(
      user.userId,
      user.role,
      formData
    );

    if (!result.ok) {
      const error = result.value as EventError;

      if (error.name === "NotAuthorizedError") {
        res.status(403).render("partials/error", {
          message: error.message,
          layout: false,
        });
        return;
      }

      if (error.name === "InvalidInputError") {
        res.status(400).render("events/create", {
          pageError: error.message,
          formData: {
            ...req.body,
            capacity: rawCapacity,
          },
        });
        return;
      }

      // fallback
      res.status(500).render("partials/error", {
        message: "Something went wrong.",
        layout: false,
      });
      return;
    }

    res.redirect(`/events/${result.value.id}`);
  }

  private getStringQuery(req: Request, key: string): string | undefined {
    return typeof req.query[key] === "string" ? req.query[key] : undefined;
  }

  async showEventDetail(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
      res.redirect("/login");
      return;
    }

    const eventId = req.params.eventId as string;

    const detailResult = await this.eventService.getEventDetailView(
      eventId,
      user.userId,
      user.role as UserRole
    );

    if (!detailResult.ok) {
      res.status(404).render("partials/error", {
        message: "Event not found.",
        layout: false,
      });
      return;
    }

    const userRSVPResult = await this.rsvpRepository.findByUserAndEvent(
      eventId,
      user.userId
    );

    const userRSVP = userRSVPResult.ok ? userRSVPResult.value : null;

    res.render("events/detail", {
      title: detailResult.value.event.title,
      event: detailResult.value.event,
      attendeeCount: detailResult.value.attendeeCount,
      user,
      userRSVP,
    });
  }

  async showEditForm(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
        res.redirect("/login");
        return;
    }

    if (user.role === "user") {
        res.status(403).render("partials/error", {
            message: "Only organizers and admins can edit events.",
            layout: false,
        });
        return;
    }

    const eventId = typeof req.params.id === "string" ? req.params.id : "";

    res.render("events/edit", {
        pageError: null,
        eventId,
        formData: {},
    });
  }

  async handleEditForm(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
        res.redirect("/login");
        return;
    }

    const eventId = typeof req.params.id === "string" ? req.params.id : "";
    const rawCapacity = typeof req.body.capacity === "string" ? req.body.capacity : "";

    const data: Partial<{
        title: string;
        description: string;
        location: string;
        category: string;
        capacity: number | null;
        startDatetime: Date;
        endDatetime: Date;
    }> = {};

    if (req.body.title) data.title = req.body.title;
    if (req.body.description) data.description = req.body.description;
    if (req.body.location) data.location = req.body.location;
    if (req.body.category) data.category = req.body.category;
    if (req.body.capacity !== undefined) data.capacity = parseCapacity(rawCapacity);
    if (req.body.startDatetime) data.startDatetime = parseDate(req.body.startDatetime);
    if (req.body.endDatetime) data.endDatetime = parseDate(req.body.endDatetime);

    const result = await this.eventService.updateEvent(
        eventId,
        user.userId,
        user.role,
        data
    );

    if (!result.ok) {
        const error = result.value as EventError;

        if (error.name === "NotAuthorizedError") {
            res.status(403).render("partials/error", {
                message: error.message,
                layout: false,
            });
            return;
        }

        if (error.name === "EventNotFoundError") {
            res.status(404).render("partials/error", {
                message: error.message,
                layout: false,
            });
            return;
        }

        if (error.name === "InvalidEventStateError") {
            res.status(400).render("partials/error", {
                message: error.message,
                layout: false,
            });
            return;
        }

        res.status(400).render("events/edit", {
            pageError: error.message,
            eventId,
            formData: { ...req.body, capacity: rawCapacity },
        });
        return;
    }

    res.redirect(`/events/${result.value.id}`);
  }
  async listEventsFromQuery(req: Request, res: Response): Promise<void> {
    const user = getAuthenticatedUser(req.session);

    if (!user) {
      res.redirect("/login");
      return;
    }

    const rawCategory = this.getStringQuery(req, "category");
    const rawTimeframe = this.getStringQuery(req, "timeframe");
    const searchQuery = this.getStringQuery(req, "searchQuery");


    const category = rawCategory && isEventCategory(rawCategory)
      ? rawCategory
      : undefined;

    const timeframe = rawTimeframe && isEventTimeframe(rawTimeframe)
      ? rawTimeframe
      : undefined;

    const result = await this.eventService.listEvents({
      category,
      timeframe,
      searchQuery,
    });
    const isHtmxRequest = req.get("HX-Request") === "true";

    if (result.ok === false) {
      const error = result.value as EventError;
      const status = error.name === "InvalidInputError" ? 400 : 500;
      if (isHtmxRequest) {
        res.status(status).render("partials/error", {
          message: error.message,
          layout: false,
        });
        return;
      }
      res.status(status).render("events/index", {
        session: req.session,
        events: [],
        searchQuery: searchQuery ?? "",
        pageError: error.message,
      });
      return;
    }

    if (isHtmxRequest) {
      res.render("events/results", {
        events: result.value,
      });
      return;
    }

    res.render("events/index", {
      session: req.session,
      events: result.value,
      searchQuery: searchQuery ?? "",
      pageError: null,
    });
  }

  async showEventsList(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const browserSession = recordPageView(store);

    const rawCategory =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const rawTimeframe =
      typeof req.query.timeframe === "string" ? req.query.timeframe : undefined;

    const category = VALID_CATEGORIES.includes(rawCategory as EventCategory)
      ? (rawCategory as EventCategory)
      : undefined;
    const timeframe = VALID_TIMEFRAMES.includes(rawTimeframe as EventTimeframe)
      ? (rawTimeframe as EventTimeframe)
      : undefined;

    const result = await this.eventService.listEvents({ category, timeframe });

    if (result.ok === false) {
      const status = this.mapErrorStatus(result.value);
      const log = status >= 500 ? this.logger.error : this.logger.warn;
      log.call(this.logger, `Failed to list events: ${result.value.message}`);
      res.status(status).render("events/list", {
        session: browserSession,
        events: [],
        activeCategory: category ?? "",
        activeTimeframe: timeframe ?? "all",
        pageError: result.value.message,
      });
      return;
    }

    res.render("events/list", {
      session: browserSession,
      events: result.value,
      activeCategory: category ?? "",
      activeTimeframe: timeframe ?? "all",
      pageError: null,
    });
  }
}

export function CreateEventController(
  eventService: IEventService,
  rsvpRepository: IRSVPRepository,
  logger: ILoggingService,
): IEventController {
  return new EventController(eventService, rsvpRepository, logger);
}
