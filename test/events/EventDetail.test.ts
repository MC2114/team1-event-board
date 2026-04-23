import { Ok, Err } from "../../src/lib/result";
import { CreateEventService } from "../../src/events/EventService";
import {
  EventNotFoundError,
  NotAuthorizedError,
  UnexpectedDependencyError as EventUnexpectedDependencyError,
} from "../../src/events/errors";
import { 
  UnexpectedDependencyError as RsvpUnexpectedDependencyError 
} from "../../src/rsvp/errors";
import {
  makeEvent,
  makeEventRepo,
  makeRsvpRepo,
} from "../helper/auth";

describe("Feature 2: EventService.getEventDetailView", () => {

  // success path: all required fields exist and startDatetime < endDatetime
  it("returns event detail with all required fields populated", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo(Ok(5));
    const service = CreateEventService(eventRepo, rsvpRepo);

    const result = await service.getEventDetailView(
        "event-1",
        "user-reader",
        "user",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const event = result.value.event;

    // check that the field exists
    expect(event.title).toBeTruthy();
    expect(event.description).toBeTruthy();
    expect(event.location).toBeTruthy();
    expect(event.category).toBeTruthy();
    expect(event.startDatetime).toBeInstanceOf(Date);
    expect(event.endDatetime).toBeInstanceOf(Date);

    // checks that startDatetime < endDatetime
    expect(event.startDatetime.getTime()).toBeLessThan(event.endDatetime.getTime());
    });

  // success path: checks that attendee count feature propagates with detail page
  it("returns event detail view with attendee count for a published event", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo(Ok(7));
    const service = CreateEventService(eventRepo, rsvpRepo);

    const result = await service.getEventDetailView(
      "event-1",
      "user-reader",
      "user",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.event.id).toBe("event-1");
    expect(result.value.attendeeCount).toBe(7);
    expect(eventRepo.findById).toHaveBeenCalledWith("event-1");
    expect(rsvpRepo.countGoing).toHaveBeenCalledWith("event-1");
  });

  // error path: EventNotFoundError; HTTP 404
  it("returns EventNotFoundError when the event does not exist", async () => {
    const eventRepo = makeEventRepo(Ok(null));
    const rsvpRepo = makeRsvpRepo();
    const service = CreateEventService(eventRepo, rsvpRepo);

    const result = await service.getEventDetailView(
      "missing-event",
      "user-reader",
      "user",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value.name).toBe("EventNotFoundError");
    expect(result.value).toEqual(
      EventNotFoundError("No event exists with the given ID."),
    );
  });

    // error path: NotAuthorizedError; checks authorization logic
  it("returns NotAuthorizedError when a user tries to view a draft event", async () => {
    const eventRepo = makeEventRepo(
      Ok(
        makeEvent({
          status: "draft",
          organizerId: "someone-else",
        }),
      ),
    );
    const rsvpRepo = makeRsvpRepo();
    const service = CreateEventService(eventRepo, rsvpRepo);

    const result = await service.getEventDetailView(
      "event-1",
      "user-reader",
      "user",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
      NotAuthorizedError("You are not authorized to view this event."),
    );
  });

  // error path: UnexpectedDependencyError; checks error propagation 
  it("maps RSVP repository failure into UnexpectedDependencyError", async () => {
    const eventRepo = makeEventRepo();
    const rsvpRepo = makeRsvpRepo(
        Err(RsvpUnexpectedDependencyError("Unable to count attendees.")),
    );
    const service = CreateEventService(eventRepo, rsvpRepo);

    const result = await service.getEventDetailView(
      "event-1",
      "user-reader",
      "user",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.value).toEqual(
        EventUnexpectedDependencyError("Unable to count attendees."),
    );
  });
});