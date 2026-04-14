import { CreateInMemoryEventRepository } from "../../src/event/InMemoryEventRepository";
import { CreateEventService } from "../../src/event/EventService";

describe("EventService.listEvents", () => {
  it("returns published upcoming events when query is empty", async () => {
    const repo = CreateInMemoryEventRepository();
    const service = CreateEventService(repo);

    await repo.create({
      id: "event-1",
      title: "Community Run",
      description: "Morning run",
      location: "Amherst",
      category: "sports",
      capacity: null,
      startDatetime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      endDatetime: new Date(Date.now() + 1000 * 60 * 60 * 25),
      organizerId: "u1",
      status: "published",
    });

    await repo.create({
      id: "event-2",
      title: "Draft Event",
      description: "Should not appear",
      location: "Boston",
      category: "social",
      capacity: null,
      startDatetime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      endDatetime: new Date(Date.now() + 1000 * 60 * 60 * 25),
      organizerId: "u1",
      status: "draft",
    });

    const result = await service.listEvents({ searchQuery: "   " });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((event) => event.id)).toEqual(["event-1"]);
    }
  });

  it("matches search query against title, description, and location", async () => {
    const repo = CreateInMemoryEventRepository();
    const service = CreateEventService(repo);

    await repo.create({
      id: "title-match",
      title: "Spring Marathon",
      description: "Road race",
      location: "Amherst",
      category: "sports",
      capacity: null,
      startDatetime: new Date(Date.now() + 1000 * 60 * 60 * 48),
      endDatetime: new Date(Date.now() + 1000 * 60 * 60 * 49),
      organizerId: "u1",
      status: "published",
    });

    await repo.create({
      id: "description-match",
      title: "Volunteer Day",
      description: "Neighborhood cleanup event",
      location: "Northampton",
      category: "volunteer",
      capacity: null,
      startDatetime: new Date(Date.now() + 1000 * 60 * 60 * 72),
      endDatetime: new Date(Date.now() + 1000 * 60 * 60 * 73),
      organizerId: "u2",
      status: "published",
    });

    await repo.create({
      id: "location-match",
      title: "Art Meetup",
      description: "Bring your sketchbook",
      location: "Holyoke",
      category: "arts",
      capacity: null,
      startDatetime: new Date(Date.now() + 1000 * 60 * 60 * 96),
      endDatetime: new Date(Date.now() + 1000 * 60 * 60 * 97),
      organizerId: "u3",
      status: "published",
    });

    const byTitle = await service.listEvents({ searchQuery: "marathon" });
    const byDescription = await service.listEvents({ searchQuery: "cleanup" });
    const byLocation = await service.listEvents({ searchQuery: "holyoke" });

    expect(byTitle.ok && byTitle.value.map((event) => event.id)).toEqual(["title-match"]);
    expect(byDescription.ok && byDescription.value.map((event) => event.id)).toEqual([
      "description-match",
    ]);
    expect(byLocation.ok && byLocation.value.map((event) => event.id)).toEqual([
      "location-match",
    ]);
  });

  it("handles case-insensitive queries and returns an empty list on no match", async () => {
    const repo = CreateInMemoryEventRepository();
    const service = CreateEventService(repo);

    await repo.create({
      id: "event-1",
      title: "Game Night",
      description: "Board games",
      location: "Amherst",
      category: "social",
      capacity: null,
      startDatetime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      endDatetime: new Date(Date.now() + 1000 * 60 * 60 * 25),
      organizerId: "u1",
      status: "published",
    });

    const upperCase = await service.listEvents({ searchQuery: "GAME" });
    const noMatch = await service.listEvents({ searchQuery: "zzz-no-match" });

    expect(upperCase.ok && upperCase.value.map((event) => event.id)).toEqual(["event-1"]);
    expect(noMatch.ok && noMatch.value).toEqual([]);
  });

  it("returns InvalidInputError for unsupported timeframe values", async () => {
    const repo = CreateInMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.listEvents({ timeframe: "bad_value" as never });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("InvalidInputError");
    }
  });
});
