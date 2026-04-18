import { Ok, Err } from "../../src/lib/result";
import { CreateEventService } from "../../src/events/EventService";
import { EventNotFoundError, NotAuthorizedError, InvalidEventStateError} from "../../src/events/errors";
import type { Event } from "../../src/events/Event";
import type { IEventRepository } from "../../src/events/EventRepository";
import type { IRSVPRepository } from "../../src/rsvp/RsvpRepository";

describe("Feature 2: EventService.updateEventStatus", () => {
  const makeEvent = (overrides: Partial<Event> = {}): Event => ({
    id: "event-1",
    title: "Spring Picnic",
    description: "Food, games, and fun on the lawn.",
    location: "Campus Pond Lawn",
    category: "party",
    status: "draft",
    capacity: 25,
    startDatetime: new Date("2030-04-20T15:00:00.000Z"),
    endDatetime: new Date("2030-04-20T17:00:00.000Z"),
    organizerId: "user-staff",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  function makeEventRepo(eventResult = Ok<Event | null>(makeEvent()), updateResult = Ok<Event | null>(makeEvent())): jest.Mocked<IEventRepository> {
    return {
      findById: jest.fn().mockResolvedValue(eventResult),
      findByOrganizer: jest.fn(),
      findAll: jest.fn(),
      findPublishedUpcoming: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(eventResult),
    };
  }

  function makeRsvpRepo(): jest.Mocked<IRSVPRepository> {
    return {
      findByUser: jest.fn(),
      findByEventId: jest.fn(),
      findByUserAndEvent: jest.fn(),
      countGoing: jest.fn().mockResolvedValue(Ok(0)),
      save: jest.fn(),
    };
  }

  it("allows staffto publish their own draft event", async () => {
    const eventRepo = makeEventRepo(
        Ok(makeEvent({ status: "draft", organizerId: "user-staff" })),
        Ok(makeEvent({ status: "published", organizerId: "user-staff" })),
    );
    const service = CreateEventService(eventRepo, makeRsvpRepo());
    const result = await service.updateEventStatus(
        "event-1",
        "user-staff",
        "staff",
        "published",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
        expect(result.value.status).toEqual("published");
    }
  });

  it("allows staff to cancel their own pbulished event", async () => {
    const eventRepo = makeEventRepo(
        Ok(makeEvent({ status: "published", organizerId: "user-staff" })),
        Ok(makeEvent({ status: "cancelled", organizerId: "user-staff" })),
    );
    const service = CreateEventService(eventRepo, makeRsvpRepo());
    const result = await service.updateEventStatus(
        "event-1",
        "user-staff",
        "staff",
        "cancelled",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
        expect(result.value.status).toEqual("cancelled");
    }
  });

  it("allows admin to publish any draft event", async () => {
    const eventRepo = makeEventRepo(
        Ok(makeEvent({ status: "draft" })),
        Ok(makeEvent({ status: "published" })),
    );
    const service = CreateEventService(eventRepo, makeRsvpRepo());
    const result = await service.updateEventStatus(
        "event-1",
        "user-admin",
        "admin",
        "published",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
        expect(result.value.status).toEqual("published");
    }
  });

  it("allows admin to cancel any published event", async () => {
    const eventRepo = makeEventRepo(
        Ok(makeEvent({ status: "published" })),
        Ok(makeEvent({ status: "cancelled" })),
    );
    const service = CreateEventService(eventRepo, makeRsvpRepo());
    const result = await service.updateEventStatus(
        "event-1",
        "user-admin",
        "admin",
        "cancelled",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
        expect(result.value.status).toEqual("cancelled");
    }
  });

  it("returns EventNotFoundError when the event does not exist", async () => {
    const eventRepo = makeEventRepo(Ok(null),);
    const service = CreateEventService(eventRepo, makeRsvpRepo());
    const result = await service.updateEventStatus(
        "missing",
        "user-staff",
        "staff",
        "published",
    );

    expect(result.ok).toBe(false);
    if (result.ok){
        expect(result.value).toEqual(EventNotFoundError("No event exists with the given ID."));
    }
  });

  it("returns NotAuthorizedError when a user tries to publish a draft event", async () => {
    const eventRepo = makeEventRepo(
        Ok(makeEvent({ status: "draft", organizerId: "someone-else" })),
        Ok(makeEvent({ status: "published", organizerId: "someone-else" })),
    );
    const service = CreateEventService(eventRepo, makeRsvpRepo());
    const result = await service.updateEventStatus(
        "event-1",
        "user-reader",
        "user",
        "published",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
        expect(result.value).toEqual(NotAuthorizedError("You are not authorized to update the event status."));
    }
  });
});
