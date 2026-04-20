import { CreateEventService } from "../../src/events/EventService";
import { CreateInMemoryEventRepository } from "../../src/events/InMemoryEventRepository";
import { CreateInMemoryRsvpRepository } from "../../src/rsvp/InMemoryRsvpRepository";

const validData = {
    title: "Test Event",
    description: "A test event description.",
    location: "Amherst, MA",
    category: "networking",
    capacity: null,
    startDatetime: new Date("2027-06-01T10:00:00"),
    endDatetime: new Date("2027-06-01T12:00:00"),
};

function makeService() {
    return CreateEventService(
        CreateInMemoryEventRepository(),
        CreateInMemoryRsvpRepository(),
    );
}

describe("EventService.createEvent", () => {
    it("creates a draft event for a staff user", async () => {
        const service = makeService();
        const result = await service.createEvent("user-staff", "staff", validData);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.title).toBe("Test Event");
            expect(result.value.status).toBe("draft");
            expect(result.value.organizerId).toBe("user-staff");
        }
    });

    it("creates a draft event for an admin user", async () => {
        const service = makeService();
        const result = await service.createEvent("user-admin", "admin", validData);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.status).toBe("draft");
            expect(result.value.organizerId).toBe("user-admin");
        }
    });

    it("creates an event with a capacity limit", async () => {
        const service = makeService();
        const result = await service.createEvent("user-staff", "staff", {
            ...validData,
            capacity: 50,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.capacity).toBe(50);
        }
    });

    it("accepts null capacity meaning no limit", async () => {
        const service = makeService();
        const result = await service.createEvent("user-staff", "staff", {
            ...validData,
            capacity: null,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.capacity).toBeNull();
        }
    });

    it("rejects event creation for a user role", async () => {
        const service = makeService();
        const result = await service.createEvent("user-reader", "user", validData);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.value.name).toBe("NotAuthorizedError");
        }
    });
});