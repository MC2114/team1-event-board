import { CreateEventService } from "../../src/events/EventService";
import { CreateInMemoryEventRepository } from "../../src/events/InMemoryEventRepository";
import { CreateInMemoryRsvpRepository } from "../../src/rsvp/InMemoryRsvpRepository";

function makeService() {
    return CreateEventService(
        CreateInMemoryEventRepository(),
        CreateInMemoryRsvpRepository(),
    );
}

const validUpdate = {
    title: "Updated Title",
    description: "Updated description.",
    location: "Updated Location",
    category: "networking",
    capacity: null,
    startDatetime: new Date("2027-06-01T10:00:00"),
    endDatetime: new Date("2027-06-01T12:00:00"),
};

describe("EventService.updateEvent", () => {
    it("allows staff to update their own draft event", async () => {
        const service = makeService();
        const result = await service.updateEvent(
            "event-draft-1",
            "user-staff",
            "staff",
            validUpdate,
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.title).toBe("Updated Title");
        }
    });

    it("allows admin to update any event", async () => {
        const service = makeService();
        const result = await service.updateEvent(
            "event-draft-1",
            "user-admin",
            "admin",
            { title: "Admin Updated Title" },
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.title).toBe("Admin Updated Title");
        }
    });

    it("allows partial updates — only provided fields change", async () => {
        const service = makeService();
        const result = await service.updateEvent(
            "event-draft-1",
            "user-staff",
            "staff",
            { title: "Just the title changed" },
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.title).toBe("Just the title changed");
            expect(result.value.location).toBe("Cape Code Lounge");
        }
    });

    it("rejects when event does not exist", async () => {
        const service = makeService();
        const result = await service.updateEvent(
            "event-does-not-exist",
            "user-staff",
            "staff",
            validUpdate,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.value.name).toBe("EventNotFoundError");
        }
    });
});