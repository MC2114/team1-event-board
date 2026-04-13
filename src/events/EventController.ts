import type { Request, Response } from "express";
import type { IEventService } from "./EventService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAuthService } from "../auth/AuthService";
import type { IUserSummary, UserRole } from "../auth/User";
import type { IAppBrowserSession } from "../session/AppSession";

export interface IEventController {
    showEventsList(req: Request, res: Response): Promise<void>;
}
