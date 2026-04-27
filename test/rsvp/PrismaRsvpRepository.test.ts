import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaRsvpRepository } from "../../src/rsvp/PrismaRsvpRepository";
import { seedTestDatabase } from "../helper/seed";

describe("PrismaRsvpRepository", () => {
  const adapter = new PrismaBetterSqlite3({
    url: "file:./prisma/dev.db",
  });
  const prisma = new PrismaClient({ adapter });
  const repository = new PrismaRsvpRepository(prisma);

  beforeEach(async () => {
    await seedTestDatabase(prisma);
    await prisma.rSVP.createMany({
      data: [
        {
          id: "rsvp-early",
          eventId: "event-published-1",
          userId: "user-reader",
          status: "going",
          createdAt: new Date("2026-04-05T10:00:00.000Z"),
        },
        {
          id: "rsvp-late",
          eventId: "event-published-1",
          userId: "user-staff",
          status: "waitlisted",
          createdAt: new Date("2026-04-05T10:10:00.000Z"),
        },
        {
          id: "rsvp-unknown-user",
          eventId: "event-published-1",
          userId: "user-unknown",
          status: "cancelled",
          createdAt: new Date("2026-04-05T10:20:00.000Z"),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("findByEventId returns RSVPs sorted by createdAt ascending", async () => {
    const result = await repository.findByEventId("event-published-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.map((rsvp) => rsvp.id)).toEqual([
      "rsvp-early",
      "rsvp-late",
      "rsvp-unknown-user",
    ]);
  });

  it("findAttendeesByEventId maps known user IDs to display names", async () => {
    const result = await repository.findAttendeesByEventId("event-published-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const attendeeNames = result.value.map((attendee) => attendee.displayName);
    expect(attendeeNames).toContain("Una User");
    expect(attendeeNames).toContain("Sam Staff");
  });

  it("findAttendeesByEventId falls back to userId when display name is unknown", async () => {
    const result = await repository.findAttendeesByEventId("event-published-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const unknown = result.value.find((attendee) => attendee.userId === "user-unknown");
    expect(unknown?.displayName).toBe("user-unknown");
  });
});
