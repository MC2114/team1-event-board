import type { Request, Response } from "express";
import { CreateEventController } from "../../src/event/EventController";
import type { IEventService } from "../../src/event/EventService";
import type { IEventRecord } from "../../src/event/Event";
import type { ILoggingService } from "../../src/service/LoggingService";
import type { IAppBrowserSession } from "../../src/session/AppSession";

function createSession(): IAppBrowserSession {
  return {
    browserId: "browser-1",
    browserLabel: "Browser B001",
    visitCount: 1,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    authenticatedUser: {
      userId: "u1",
      email: "member@app.test",
      displayName: "Member",
      role: "user",
      signedInAt: new Date().toISOString(),
    },
  };
}

function createResponse(): Response {
  const response = {
    status: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
  };

  return response as unknown as Response;
}

describe("EventController", () => {
  it("forwards searchQuery to the service and renders success response", async () => {
    const listEvents = jest.fn().mockResolvedValue({ ok: true, value: [] as IEventRecord[] });
    const service = { listEvents } as unknown as IEventService;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as ILoggingService;

    const controller = CreateEventController(service, logger);
    const req = { query: { searchQuery: "music" } } as unknown as Request;
    const res = createResponse();

    await controller.listEventsFromQuery(req, res, createSession());

    expect(listEvents).toHaveBeenCalledWith({ searchQuery: "music" });
    expect((res.render as unknown as jest.Mock).mock.calls[0][0]).toBe("home");
    expect((res.render as unknown as jest.Mock).mock.calls[0][1]).toMatchObject({
      pageError: null,
      searchQuery: "music",
    });
  });

  it("maps InvalidInputError to 400", async () => {
    const service = {
      listEvents: jest.fn().mockResolvedValue({
        ok: false,
        value: { name: "InvalidInputError", message: "Invalid timeframe" },
      }),
    } as unknown as IEventService;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as ILoggingService;

    const controller = CreateEventController(service, logger);
    const req = { query: { searchQuery: "music" } } as unknown as Request;
    const res = createResponse();

    await controller.listEventsFromQuery(req, res, createSession());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalled();
  });

  it("maps unknown errors to 500", async () => {
    const service = {
      listEvents: jest.fn().mockResolvedValue({
        ok: false,
        value: { name: "InvalidEventStateError", message: "Unexpected state" },
      }),
    } as unknown as IEventService;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as ILoggingService;

    const controller = CreateEventController(service, logger);
    const req = { query: { searchQuery: "music" } } as unknown as Request;
    const res = createResponse();

    await controller.listEventsFromQuery(req, res, createSession());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalled();
  });
});
