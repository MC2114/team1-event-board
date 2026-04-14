import type { Request, Response } from "express";
import { getAuthenticatedUser, AppSessionStore } from "../session/AppSession";
import type { IEventService } from "./EventService";
import type { IRsvpRepository } from "../rsvp/RsvpRepository";
import type { UserRole } from "../auth/User";
import { NotAuthorizedError, InvalidInputError } from "../errors";

export interface IEventController {
  showCreateForm(req: Request, res: Response): void;
  handleCreateForm(req: Request, res: Response): Promise<void>;
  showEventDetail(req: Request, res: Response): Promise<void>;
  showEditForm(req: Request, res: Response): Promise<void>;
  handleEditForm(req: Request, res: Response): Promise<void>;
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
    private readonly rsvpRepository: IRsvpRepository,
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
        const error = result.value;

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
}

export function CreateEventController(
  eventService: IEventService,
  rsvpRepository: IRsvpRepository,
): IEventController {
  return new EventController(eventService, rsvpRepository);
}