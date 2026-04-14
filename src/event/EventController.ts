import type { Request, Response } from "express";
import type { IAppBrowserSession } from "../session/AppSession";
import type { ILoggingService } from "../service/LoggingService";
import type { IEventService } from "./EventService";
import type { EventError } from "./errors";

export interface IEventController {
  listEventsFromQuery(
    req: Request,
    res: Response,
    session: IAppBrowserSession,
  ): Promise<void>;
}

class EventController implements IEventController {
  constructor(
    private readonly service: IEventService,
    private readonly logger: ILoggingService,
  ) {}

  private mapErrorStatus(error: EventError): number {
    if (error.name === "InvalidInputError") return 400;
    if (error.name === "NotAuthorizedError") return 403;
    if (error.name === "EventNotFoundError") return 404;
    return 500;
  }

  private isHtmxRequest(req: Request): boolean {
    return req.get("HX-Request") === "true";
  }

  async listEventsFromQuery(
    req: Request,
    res: Response,
    session: IAppBrowserSession,
  ): Promise<void> {
    const searchQuery = typeof req.query.searchQuery === "string" ? req.query.searchQuery : "";
    const result = await this.service.listEvents({ searchQuery });

    if (result.ok === false) {
      const status = this.mapErrorStatus(result.value);
      const log = status >= 500 ? this.logger.error : this.logger.warn;
      log.call(this.logger, `Event search failed: ${result.value.message}`);
      if (this.isHtmxRequest(req)) {
        res.status(status).render("partials/error", {
          message: result.value.message,
          layout: false,
        });
        return;
      }

      res.status(status).render("events/index", {
        session,
        pageError: result.value.message,
        events: [],
        searchQuery,
      });
      return;
    }

    if (this.isHtmxRequest(req)) {
      res.render("events/results", {
        layout: false,
        events: result.value,
      });
      return;
    }

    res.render("events/index", {
      session,
      pageError: null,
      events: result.value,
      searchQuery,
    });
  }
}

export function CreateEventController(
  service: IEventService,
  logger: ILoggingService,
): IEventController {
  return new EventController(service, logger);
}
