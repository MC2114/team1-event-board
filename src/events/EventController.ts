import type { Request, Response } from "express";
import type { IEventService } from "./EventService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAuthService } from "../auth/AuthService";
import type { IUserSummary, UserRole } from "../auth/User";
import type { IAppBrowserSession } from "../session/AppSession";
import type { EventError } from "./errors";
import type { EventCategory, EventTimeframe } from "./Event";

export interface IEventController {
    showEventsList(req: Request, res: Response): Promise<void>;
}

class EventController implements IEventController {
    constructor(private readonly eventService: IEventService, private readonly logger: ILoggingService) {}

    private mapErrorStatus(error: EventError): number {
        if (error.name === "InvalidInputError") return 400;
        if (error.name === "EventNotFoundError") return 404;
        if (error.name === "NotAuthorizedError") return 403;
        if (error.name === "InvalidEventStateError") return 400;
        return 500;
    }

    async showEventsList(req: Request, res: Response): Promise<void> {
        const rawCategory = typeof req.query.category === "string" ? req.query.category : undefined;
        const rawTimeframe = typeof req.query.timeframe === "string" ? req.query.timeframe : undefined;

        const result = await this.eventService.listEvents({ category: rawCategory | undefined, timeframe: rawTimeframe | undefined});
        if (result.ok === false) {
            const status = this.mapErrorStatus(result.value);
            const log = status >= 500 ? this.logger.error : this.logger.warn;
            log.call(this.logger, `Failed to list events: ${result.value.message}`);
            res.status(status).render("events/list", { events: [] , pageError: result.value.message, category: rawCategory, timeframe: rawTimeframe });
            return;
        }
    }
}