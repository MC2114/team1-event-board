import { CreateInMemoryEventRepository } from "../../src/event/InMemoryEventRepository";

describe("InMemoryEventRepository", () => {
  it("returns only published upcoming events", async () => {
    const repo = CreateInMemoryEventRepository();

    const now = new Date("2026-04-13T12:00:00.000Z");

    await repo.create({
      id: "event-1",
      title: "Published Upcoming",
      description: "desc",
      location: "Amherst",
      category: "social",
      capacity: null,
      startDatetime: new Date("2026-04-20T12:00:00.000Z"),
      endDatetime: new Date("2026-04-20T13:00:00.000Z"),
      organizerId: "u1",
      status: "published",
    });

    await repo.create({
      id: "event-2",
      title: "Draft Upcoming",
      description: "desc",
      location: "Amherst",
      category: "social",
      capacity: null,
      startDatetime: new Date("2026-04-20T12:00:00.000Z"),
      endDatetime: new Date("2026-04-20T13:00:00.000Z"),
      organizerId: "u1",
      status: "draft",
    });

    await repo.create({
      id: "event-3",
      title: "Published Past",
      description: "desc",
      location: "Amherst",
      category: "social",
      capacity: null,
      startDatetime: new Date("2026-04-10T12:00:00.000Z"),
      endDatetime: new Date("2026-04-10T13:00:00.000Z"),
      organizerId: "u1",
      status: "published",
    });

    const result = await repo.listPublishedUpcoming(now);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("event-1");
  });

  it("sorts published upcoming events by startDatetime ascending", async () => {
    const repo = CreateInMemoryEventRepository();

    const now = new Date("2026-04-13T12:00:00.000Z");

    await repo.create({
      id: "event-2",
      title: "Second",
      description: "desc",
      location: "Amherst",
      category: "social",
      capacity: null,
      startDatetime: new Date("2026-04-22T12:00:00.000Z"),
      endDatetime: new Date("2026-04-22T13:00:00.000Z"),
      organizerId: "u1",
      status: "published",
    });

    await repo.create({
      id: "event-1",
      title: "First",
      description: "desc",
      location: "Amherst",
      category: "social",
      capacity: null,
      startDatetime: new Date("2026-04-20T12:00:00.000Z"),
      endDatetime: new Date("2026-04-20T13:00:00.000Z"),
      organizerId: "u1",
      status: "published",
    });

    const result = await repo.listPublishedUpcoming(now);

    expect(result.map((event) => event.id)).toEqual(["event-1", "event-2"]);
  });
});
