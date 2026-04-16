import { Ok } from "../../src/lib/result";
import { CreateEventService } from "../../src/events/EventService";
import type { Event } from "../../src/events/Event";
import type { IEventRepository } from "../../src/events/EventRepository";
import type { IRSVPRepository } from "../../src/rsvp/RsvpRepository";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    title: "Spring Picnic",
    description: "Food and games for everyone.",
    location: "Campus Green",
    category: "party",
    status: "published",
    capacity: null,
    startDatetime: new Date("2099-06-15T18:00:00.000Z"),
    endDatetime: new Date("2099-06-15T20:00:00.000Z"),
    organizerId: "user-staff",
    createdAt: new Date("2099-05-01T00:00:00.000Z"),
    updatedAt: new Date("2099-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeEventRepo(events: Event[]): jest.Mocked<IEventRepository> {
  return {
    findById: jest.fn(),
    findByOrganizer: jest.fn(),
    findAll: jest.fn().mockResolvedValue(Ok(events)),
    findPublishedUpcoming: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };
}

function makeRsvpRepo(): jest.Mocked<IRSVPRepository> {
  return {
    findByUser: jest.fn(),
    findByEventId: jest.fn(),
    findByUserAndEvent: jest.fn(),
    countGoing: jest.fn(),
    save: jest.fn(),
  };
}

describe("Feature 10 Sprint 2 - Event Search unit", () => {
  it("matches published upcoming events case-insensitively across searchable fields", async () => {
    const events = [
      makeEvent({ id: "event-match", title: "Case Insensitive Event" }),
      makeEvent({ id: "event-other", title: "Another Event", location: "Library" }),
    ];
    const service = CreateEventService(makeEventRepo(events), makeRsvpRepo());

    const result = await service.listEvents("user-1", "user", {
      searchQuery: "cAsE inSENsItive",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe("event-match");
  });

  it("returns all visible published upcoming events for an empty query", async () => {
    const events = [
      makeEvent({ id: "event-published-future" }),
      makeEvent({ id: "event-past", startDatetime: new Date("2000-01-01T00:00:00.000Z") }),
      makeEvent({ id: "event-draft", status: "draft" }),
    ];
    const service = CreateEventService(makeEventRepo(events), makeRsvpRepo());

    const result = await service.listEvents("user-1", "user", { searchQuery: "   " });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.map((event) => event.id)).toEqual(["event-published-future"]);
  });
});
