import request from "supertest";
import { createComposedApp } from "../../src/composition";
import { loginAs } from "../helper/auth";

describe("Feature 4: RSVP Toggle", () => {
  const app = createComposedApp().getExpressApp();

  const USER_EMAIL = "user@app.test";
  const USER_PASSWORD = "password123";

  const STAFF_EMAIL = "staff@app.test";
  const STAFF_PASSWORD = "password123";

  const ADMIN_EMAIL = "admin@app.test";
  const ADMIN_PASSWORD = "password123";

  
  // success path: role user can RSVP to a published event
  it("returns 302 and redirects after a user RSVPs to a published event", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.post("/events/event-published-2/rsvp");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/events/event-published-2");
    expect(res.headers.location).toContain("rsvpMessage=");
  });

  // success path: toggling again cancels an existing RSVP
  it("returns 302 and redirects after cancelling an existing RSVP", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.post("/events/event-published-1/rsvp");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/events/event-published-1");
    expect(res.headers.location).toContain("cancelled");
  });

  // success path: full event places user on waitlist
  it("returns 302 and redirects with a waitlist message when the event is full", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.post("/events/event-published-1/rsvp");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/events/event-published-1");
  });

  // success path: HTMX request returns partial HTML instead of redirect
  it("returns 200 and partial HTML for an HTMX RSVP request", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent
      .post("/events/event-published-2/rsvp")
      .set("HX-Request", "true");

    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.text).toContain("rsvp-section");
  });

  // error path: unauthenticated user cannot RSVP
  it("returns 401 for an unauthenticated RSVP POST request", async () => {
    const res = await request(app).post("/events/event-published-1/rsvp");

    expect(res.status).toBe(401);
    expect(res.text).toContain("Please log in to continue.");
  });

  // error path: event does not exist
  it("returns 404 when trying to RSVP to a non-existent event", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.post("/events/does-not-exist/rsvp");

    expect(res.status).toBe(404);
    expect(res.text).toContain("not found");
  });

  // error path: role staff cannot RSVP
  it("returns 400 when an individual with role staff attempts to RSVP", async () => {
    const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
    const res = await agent.post("/events/event-published-1/rsvp");

    expect(res.status).toBe(400);
    expect(res.text).toContain("cannot RSVP");
  });

  // error path: role admin cannot RSVP
  it("returns 400 when an individual with role admin attempts to RSVP", async () => {
    const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await agent.post("/events/event-published-1/rsvp");

    expect(res.status).toBe(400);
    expect(res.text).toContain("cannot RSVP");
  });

  // error path: user cannot RSVP to a cancelled event
  it("returns 400 when a user tries to RSVP to a cancelled event", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.post("/events/event-cancelled-1/rsvp");

    expect(res.status).toBe(400);
    expect(res.text).toContain("Cannot RSVP");
  });
});