import { Ok } from "../../src/lib/result";
import { CreateRsvpService } from "../../src/rsvp/RsvpService";
import type { RSVPWithEvent } from "../../src/rsvp/RSVP";
import {
    makeEvent,
    makeEventRepo,
    makeLogger,
    makeRsvpRepo,
} from "../helper/auth";

describe("Feature 7: getRSVPsByUser (Dashboard)", () => {
    const makeRSVPWithEvent = (
        overrides: Partial<RSVPWithEvent> = {},
    ): RSVPWithEvent => ({
        id: "r1",
        eventId: "e1",
        userId: "user-1",
        status: "going",
        createdAt: new Date("2025-01-01"),
        event: makeEvent(),
        ...overrides,
    });

    it("returns RSVPs sorted by createdAt descending", async () => {
        const rsvps = [
            makeRSVPWithEvent({ id: "old", createdAt: new Date("2020-01-01") }),
            makeRSVPWithEvent({ id: "new", createdAt: new Date("2030-01-01") }),
        ]
        const rsvpRepo = makeRsvpRepo();
        rsvpRepo.findByUser.mockResolvedValue(Ok(rsvps));

        const service = CreateRsvpService(
            rsvpRepo,
            makeEventRepo(),
            makeLogger(),
        );

        const result = await service.getRSVPsByUser("user-1");

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value[0].id).toBe("new");
        expect(result.value[1].id).toBe("old");
    });

    it("returns empty array when user has no RSVPs", async () => {
        const rsvpRepo = makeRsvpRepo();
        rsvpRepo.findByUser.mockResolvedValue(Ok([]));

        const service = CreateRsvpService(
            rsvpRepo,
            makeEventRepo(),
            makeLogger(),
        );

        const result = await service.getRSVPsByUser("user-1");
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value).toEqual([]);
    });

    
}) 