import type { Request, Response } from "express";
import { getAuthenticatedUser, AppSessionStore } from "../session/AppSession";
import type { IEventService } from "./EventService";
import type { IRSVPRepository } from "../rsvp/RsvpRepository";
import type { UserRole } from "../auth/User";
import { NotAuthorizedError, InvalidInputError } from "../errors";
import type { EventError } from "./errors";
import { isEventCategory, isEventTimeframe } from "./Event";

export interface IEventController {
  showCreateForm(req: Request, res: Response): void;
  handleCreateForm(req: Request, res: Response): Promise<void>;
  showEventDetail(req: Request, res: Response): Promise<void>;
  listEventsFromQuery(req: Request, res: Response): Promise<void>,
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
  ) { }

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
      const error = result.value;

      if (error instanceof NotAuthorizedError) {
        res.status(403).render("partials/error", {
          message: error.message,
          layout: false,
        });
        return;
      }

      if (error instanceof InvalidInputError) {
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
}

export function CreateEventController(
  eventService: IEventService,
  rsvpRepository: IRSVPRepository,
): IEventController {
  return new EventController(eventService, rsvpRepository);
}
