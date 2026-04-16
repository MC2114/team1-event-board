import { Ok } from "../../src/lib/result";
import { CreateRsvpService } from "../../src/rsvp/RsvpService";
import { EventNotFoundError, NotAuthorizedError } from "../../src/rsvp/errors";
import type { IEventRepository } from "../../src/events/EventRepository";
import type { Event } from "../../src/events/Event";
import type { IRSVPRepository } from "../../src/rsvp/RsvpRepository";
import type { RSVP } from "../../src/rsvp/RSVP";
import type { ILoggingService } from "../../src/service/LoggingService";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    title: "Spring Picnic",
    description: "Food and games for everyone.",
    location: "Campus Green",
    category: "party",
    status: "published",
    capacity: 50,
    startDatetime: new Date("2099-06-15T18:00:00.000Z"),
    endDatetime: new Date("2099-06-15T20:00:00.000Z"),
    organizerId: "user-staff",
    createdAt: new Date("2099-05-01T00:00:00.000Z"),
    updatedAt: new Date("2099-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeRsvp(overrides: Partial<RSVP> = {}): RSVP {
  return {
    id: "rsvp-1",
    eventId: "event-1",
    userId: "user-1",
    status: "going",
    createdAt: new Date("2099-06-01T10:00:00.000Z"),
    ...overrides,
  };
}

function makeEventRepo(event: Event | null): jest.Mocked<IEventRepository> {
  return {
    findById: jest.fn().mockResolvedValue(Ok(event)),
    findByOrganizer: jest.fn(),
    findAll: jest.fn(),
    findPublishedUpcoming: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };
}

function makeRsvpRepo(rsvps: RSVP[]): jest.Mocked<IRSVPRepository> {
  return {
    findByUser: jest.fn(),
    findByEventId: jest.fn().mockResolvedValue(Ok(rsvps)),
    findByUserAndEvent: jest.fn(),
    countGoing: jest.fn(),
    save: jest.fn(),
  };
}

function makeLogger(): jest.Mocked<ILoggingService> {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

describe("Feature 12 Sprint 2 - Attendee List unit", () => {
  it("groups attendee RSVPs into going, waitlisted, and cancelled", async () => {
    const service = CreateRsvpService(
      makeRsvpRepo([
        makeRsvp({ id: "rsvp-going", status: "going" }),
        makeRsvp({ id: "rsvp-waitlisted", status: "waitlisted" }),
        makeRsvp({ id: "rsvp-cancelled", status: "cancelled" }),
      ]),
      makeEventRepo(makeEvent()),
      makeLogger(),
    );

    const result = await service.getRSVPsByEvent("event-1", "user-staff", "staff");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.going).toHaveLength(1);
    expect(result.value.waitlisted).toHaveLength(1);
    expect(result.value.cancelled).toHaveLength(1);
  });

  it("returns NotAuthorizedError when a member requests attendee list", async () => {
    const service = CreateRsvpService(
      makeRsvpRepo([]),
      makeEventRepo(makeEvent()),
      makeLogger(),
    );

    const result = await service.getRSVPsByEvent("event-1", "user-1", "user");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(NotAuthorizedError("Users cannot view attendee lists"));
  });

  it("returns EventNotFoundError for a missing event", async () => {
    const service = CreateRsvpService(
      makeRsvpRepo([]),
      makeEventRepo(null),
      makeLogger(),
    );

    const result = await service.getRSVPsByEvent("missing-event", "admin-1", "admin");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(EventNotFoundError("Event missing-event not found"));
  });
});
