import type { Request, Response } from "express";
import type { IEventService } from "./EventService";
import type { AppSessionStore } from "../session/AppSession";
import { getAuthenticatedUser } from "../session/AppSession";
import { NotAuthorizedError, InvalidInputError } from "../errors";

export interface IEventController {
  showCreateForm(req: Request, res: Response): void;
  handleCreateForm(req: Request, res: Response): void;
}

function parseCapacity(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

function parseDate(raw: string): Date {
  return new Date(raw);
}

export function CreateEventController(
  eventService: IEventService
): IEventController {
  function showCreateForm(req: Request, res: Response): void {
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

  function handleCreateForm(req: Request, res: Response): void {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
      res.redirect("/login");
      return;
    }

    const rawCapacity = typeof req.body.capacity === "string" ? req.body.capacity : "";
    const formData = {
      title: typeof req.body.title === "string" ? req.body.title : "",
      description: typeof req.body.description === "string" ? req.body.description : "",
      location: typeof req.body.location === "string" ? req.body.location : "",
      category: typeof req.body.category === "string" ? req.body.category : "",
      capacity: parseCapacity(rawCapacity),
      startDatetime: parseDate(
        typeof req.body.startDatetime === "string" ? req.body.startDatetime : ""
      ),
      endDatetime: parseDate(
        typeof req.body.endDatetime === "string" ? req.body.endDatetime : ""
      ),
    };

    const result = eventService.createEvent(user.userId, user.role, formData);

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
    }

    if (result.ok) {
      res.redirect(`/events/${result.value.id}`);
    }
  }

  return { showCreateForm, handleCreateForm };
}