import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../session/AppSession";
import { IEventService } from "./EventService";
import type { IRsvpRepository } from "../rsvp/RsvpRepository";
import type { UserRole } from "../auth/User";

export class EventController {
  constructor(
    private readonly eventService: IEventService,
    private readonly rsvpRepository: IRsvpRepository,
  ) {}

  async showEventDetail(req: Request, res: Response): Promise<void> {
    const user = getAuthenticatedUser(req.session);

    if (!user) {
      res.redirect("/login");
      return;
    }

    const eventId = req.params.eventId as string;
    const actingUserId = user.userId;
    const actingUserRole = user.role as UserRole;

    const detailResult = await this.eventService.getEventDetailView(
      eventId,
      actingUserId,
      actingUserRole,
    );

    if (!detailResult.ok) {
      res.status(404).render("partials/error", {
        error: "Event not found.",
      });
      return;
    }

    const userRSVPResult = await this.rsvpRepository.findByUserAndEvent(
      eventId,
      actingUserId,
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
}