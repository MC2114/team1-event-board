import { response, type Response } from "express";
import type { IRsvpService } from "./RsvpService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAppBrowserSession } from "../session/AppSession";
import type { RSVPError } from "./errors";
import { EventError } from "../events/errors";

export interface IRsvpController {
    showMyRsvps(res: Response, session: IAppBrowserSession): Promise<void>;
    toggleRsvp(
        res: Response,
        eventId: string,
        session: IAppBrowserSession,
    ): Promise<void>;
    showEventAtAttendees(
        res: Response,
        eventId: string,
        session: IAppBrowserSession,
    ): Promise<void>;
}

class RsvpController implements IRsvpController {
    constructor(
        private readonly service: IRsvpService,
        private readonly logger: ILoggingService,
    ) { }

    private mapErrorStatus(error: RSVPError | EventError): number {
        switch (error.name) {
            case "EventNotFoundError":
                return 404;

            case "NotAuthorizedError":
                return 403;

            case "InvalidRSVPError":
            case "InvalidEventStateError":
            case "InvalidInputError":
                return 400;

            case "UnexpectedDependencyError":
                return 500;

            default:
                return 500;
        }
    }

    async showMyRsvps(res: Response, session: IAppBrowserSession): Promise<void> {
        const userId = session.authenticatedUser!.userId
        const result = await this.service.getRSVPsByUser(userId);

        if (result.ok === false) {
            const status = this.mapErrorStatus(result.value)
            this.logger.error(`showMyRsvps failed: ${result.value.message}`)
            res.status(status).render("error", { message: result.value.message, session })
            return;
        }

        res.render("rsvps/dashboard", { rsvp: result.value, session });
    }

    async toggleRsvp(res: Response, eventId: string, session: IAppBrowserSession): Promise<void> {
        const { userId: userId, role } = session.authenticatedUser!;
        const result = await this.service.toggleRSVP(eventId, userId, role);

        if (result.ok === false) {
            const status = this.mapErrorStatus(result.value);
            this.logger.warn(`toggleRsvp failed: ${result.value.message}`);
            res.status(status).render("error", { message: result.value.message, session });
            return;
        }

        this.logger.info(`User ${userId} toggled RSVP for event ${eventId} - status: ${result.value.status}`);
        res.redirect("back");
    }

    async showEventAtAttendees(res: Response, eventId: string, session: IAppBrowserSession): Promise<void> {
        const { userId: userId, role } = session.authenticatedUser!;

        const result = await this.service.getRSVPsByEvent(eventId, userId, role);

        if (result.ok === false) {
            const status = this.mapErrorStatus(result.value);
            this.logger.warn(`showEventAttendees failed: ${result.value.message}`);
            res.status(status).render("error", { message: result.value.message, session });
            return;
        }

        res.render("rsvps/attendees", { rsvps: result.value, session });
    }
}

export function CreateRsvpController(
    service: IRsvpService,
    logger: ILoggingService,
): IRsvpController {
    return new RsvpController(service, logger);
}