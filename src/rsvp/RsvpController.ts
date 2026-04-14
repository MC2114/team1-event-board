import type { Response } from "express";
import type { IRsvpService } from "./RsvpService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAppBrowserSession } from "../session/AppSession";
import type { RsvpError } from "./errors";

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

