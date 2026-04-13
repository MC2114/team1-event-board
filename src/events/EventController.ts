import type { Request, Response } from "express";
import type { IEventService } from "./EventService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAuthService } from "../auth/AuthService";
import type { IUserSummary, UserRole } from "../auth/User";
import type { IAppBrowserSession } from "../session/AppSession";

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
}