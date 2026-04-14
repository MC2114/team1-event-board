import type { Request, Response } from "express";
import type { IEventService } from "./EventService";
import type { ILoggingService } from "../service/LoggingService";
import { recordPageView, type AppSessionStore } from "../session/AppSession";
import type { EventError } from "./errors";
import { VALID_CATEGORIES, VALID_TIMEFRAMES, type EventCategory, type EventTimeframe } from "./Event";


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
        const store = req.session as AppSessionStore;
        const browserSession = recordPageView(store);
        
        const rawCategory = typeof req.query.category === "string" ? req.query.category : undefined;
        const rawTimeframe = typeof req.query.timeframe === "string" ? req.query.timeframe : undefined;

        const category = VALID_CATEGORIES.includes(rawCategory as EventCategory)
            ? (rawCategory as EventCategory)
            : undefined;
        const timeframe = VALID_TIMEFRAMES.includes(rawTimeframe as EventTimeframe)
            ? (rawTimeframe as EventTimeframe)
            : undefined;
        
        const result = await this.eventService.listEvents({ category, timeframe});
        
        
        if (result.ok === false) {
            const status = this.mapErrorStatus(result.value);
            const log = status >= 500 ? this.logger.error : this.logger.warn;
            log.call(this.logger, `Failed to list events: ${result.value.message}`);
            res.status(status).render("events/list", { 
                session: browserSession,
                events: [], 
                activeCategory: category ?? "", 
                activeTimeframe: timeframe ?? "all",
                pageError: result.value.message
            });
            return;
        }

        res.render("events/list", { 
            session: browserSession,
            events: result.value, 
            activeCategory: category ?? "", 
            activeTimeframe: timeframe ?? "all",
            pageError: null
        });
    }
}

export function CreateEventController(eventService: IEventService, logger: ILoggingService): IEventController {
    return new EventController(eventService, logger);
}