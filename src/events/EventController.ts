import type { Request, Response } from "express";
import { getAuthenticatedUser, AppSessionStore } from "../session/AppSession";
import type { IEventService } from "./EventService";
import type { IRsvpRepository } from "../rsvp/RsvpRepository";
import type { UserRole } from "../auth/User";
import { NotAuthorizedError, InvalidInputError } from "../errors";
import { EventNotFoundError } from "./errors";

export interface IEventController {
  showCreateForm(req: Request, res: Response): void;
  handleCreateForm(req: Request, res: Response): Promise<void>;
  showEventDetail(req: Request, res: Response): Promise<void>;
  showManage(req: Request, res: Response): Promise<void>;
  publishEvent(req: Request, res: Response): Promise<void>;
  cancelEvent(req: Request, res: Response): Promise<void>;
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

  async showManage(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
      res.redirect("/login");
      return;
    }
  
    const result = await this.eventService.getAllEventsForManager(user.userId, user.role);

    if (result.ok === false) {
      res.status(500).render("partials/error", {
        message: "Something went wrong.",
        layout: false,
      });
      return;
    }

    res.render("events/manage", {
      session: {authenticatedUser: user},
      events: result.value,
      pageError: null,
    });
  }

  async publishEvent(req: Request, res: Response): Promise<void> {
      const store = req.session as AppSessionStore;
      const user = getAuthenticatedUser(store);

      if (!user){
        res.redirect("/login")
        return;
      }

      const eventId = typeof req.params.id === "string" ? req.params.id : "";

      const result = await this.eventService.updateEventStatus(eventId, user.userId, user.role, "published");

      if (result.ok === false){
        let status = 500;

        if (result.value.name === "EventNotFoundError"){
          status = 404;
        }

        if (result.value.name === "NotAuthorizedError"){
          status = 403;
        }

        if (result.value.name === "InvalidEventStateError"){
          status = 400;
        }

        res.status(status).render("partials/error", {
          message: result.value.message,
          layout: false,
        });
        return;
      }

      res.redirect("/events/manage");
  }

  async cancelEvent(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user){
      res.redirect("/login");
      return;
    }

    const eventId = typeof req.params.id === "string" ? req.params.id : "";

    const result = await this.eventService.updateEventStatus(eventId, user.userId, user.role, "cancelled");

    if (result.ok === false){
      let status = 500;

      if (result.value.name === "EventNotFoundError"){
        status = 404;
      }

      if (result.value.name === "NotAuthorizedError"){
        status = 403;
      }

      if (result.value.name === "InvalidEventStateError"){
        status = 400;
      }

      res.status(status).render("partials/error", {
        message: result.value.message,
        layout: false,
      });
      return;
    }

    res.redirect("/events/manage");
  }
}

export function CreateEventController(
  eventService: IEventService,
  rsvpRepository: IRsvpRepository,
): IEventController {
  return new EventController(eventService, rsvpRepository);
}