import { Ok, Err } from "../../src/lib/result";
import { CreateRsvpService } from "../../src/rsvp/RsvpService";
import {
  EventNotFoundError,
  InvalidRSVPError,
  UnexpectedDependencyError,
} from "../../src/rsvp/errors";
import type { RSVP } from "../../src/rsvp/RSVP";
import type { ILoggingService } from "../../src/service/LoggingService";
import {
  makeEvent,
  makeEventRepo,
  makeRsvpRepo,
} from "../helper/auth";

describe("Feature 4: RsvpService.toggleRSVP", () => {

  const makeRsvp = (overrides: Partial<RSVP> = {}): RSVP => ({
    id: "rsvp-1",
    eventId: "event-1",
    userId: "user-reader",
    status: "going",
    createdAt: new Date("2099-04-01T10:00:00.000Z"),
    ...overrides,
  });

  function makeLogger(): jest.Mocked<ILoggingService> {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }

  // success path: not RSVP'd + space available -> going
  it("returns a going RSVP when the user has no existing RSVP and the event has capacity", async () => {
    const eventRepo = makeEventRepo(
      Ok(makeEvent({ capacity: 10 })),
    );
    const rsvpRepo = makeRsvpRepo(Ok(2));
    rsvpRepo.findByUserAndEvent.mockResolvedValue(Ok(null));
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.status).toBe("going");
    expect(result.value.eventId).toBe("event-1");
    expect(result.value.userId).toBe("user-reader");
    expect(rsvpRepo.save).toHaveBeenCalled();
  });

  // success path: no existing RSVP + event full capacity -> waitlisted
  it("returns a waitlisted RSVP when the event is full", async () => {
    const eventRepo = makeEventRepo(
      Ok(makeEvent({ capacity: 2 })),
    );
    const rsvpRepo = makeRsvpRepo(Ok(2));
    rsvpRepo.findByUserAndEvent.mockResolvedValue(Ok(null));
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.status).toBe("waitlisted");
    expect(rsvpRepo.save).toHaveBeenCalled();
  });

  // success path: existing active RSVP -> cancelled
  it("cancels an existing going RSVP when the user toggles again", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo();
    rsvpRepo.findByUserAndEvent.mockResolvedValue(
      Ok(makeRsvp({ status: "going" })),
    );
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.status).toBe("cancelled");
    expect(result.value.id).toBe("rsvp-1");
    expect(rsvpRepo.save).toHaveBeenCalled();
  });

  // success path: existing waitlisted RSVP -> cancelled
  it("cancels an existing waitlisted RSVP when the user toggles again", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo();
    rsvpRepo.findByUserAndEvent.mockResolvedValue(
      Ok(makeRsvp({ status: "waitlisted" })),
    );
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.status).toBe("cancelled");
    expect(rsvpRepo.save).toHaveBeenCalled();
  });

  // error path: staff/admin cannot RSVP
  it("returns InvalidRSVPError when a staff user attempts to RSVP", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo();
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-staff", "staff");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
      InvalidRSVPError("Organizers and admins cannot RSVP to events"),
    );
  });

  // error path: event does not exist
  it("returns EventNotFoundError when the event does not exist", async () => {
    const eventRepo = makeEventRepo(Ok(null));
    const rsvpRepo = makeRsvpRepo();
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("missing-event", "user-reader", "user");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
      EventNotFoundError("Event missing-event not found"),
    );
  });

  // error path: cancelled event
  it("returns InvalidRSVPError when the event is cancelled", async () => {
    const eventRepo = makeEventRepo(
      Ok(makeEvent({ status: "cancelled" })),
    );
    const rsvpRepo = makeRsvpRepo();
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
      InvalidRSVPError("Cannot RSVP to a cancelled or past event"),
    );
  });

  // error path: past event
  it("returns InvalidRSVPError when the event is past", async () => {
    const eventRepo = makeEventRepo(
      Ok(makeEvent({ status: "past" })),
    );
    const rsvpRepo = makeRsvpRepo();
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
      InvalidRSVPError("Cannot RSVP to a cancelled or past event"),
    );
  });

  // error path: existing RSVP lookup fails
  it("propagates RSVP repository errors when existing RSVP lookup fails", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo();
    rsvpRepo.findByUserAndEvent.mockResolvedValue(
      Err(UnexpectedDependencyError("Unable to look up RSVP.")),
    );
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
      UnexpectedDependencyError("Unable to look up RSVP."),
    );
  });

  // error path: countGoing fails during capacity check
  it("propagates RSVP repository errors when attendee counting fails", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo();
    rsvpRepo.findByUserAndEvent.mockResolvedValue(Ok(null));
    rsvpRepo.countGoing.mockResolvedValue(
      Err(UnexpectedDependencyError("Unable to count attendees.")),
    );
    const logger = makeLogger();

    const service = CreateRsvpService(rsvpRepo, eventRepo, logger);

    const result = await service.toggleRSVP("event-1", "user-reader", "user");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
      UnexpectedDependencyError("Unable to count attendees."),
    );
  });
});