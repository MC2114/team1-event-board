import request from "supertest";
import { createComposedApp } from "../../src/composition";
import { loginAs } from "../helper/auth";

describe("Feature 2: Event Detail Page", () => {
  const app = createComposedApp().getExpressApp();

  const USER_EMAIL = "user@app.test";
  const USER_PASSWORD = "password123";

  const STAFF_EMAIL = "staff@app.test";
  const STAFF_PASSWORD = "password123";

  const ADMIN_EMAIL = "admin@app.test";
  const ADMIN_PASSWORD = "password123";


  // success path: published event is visible to logged-in user
  it("returns 200 and renders a published event detail page for a logged-in user", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.get("/events/event-published-1");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Spring Picnic");
    expect(res.text).toContain("Campus Pond Lawn");
    expect(res.text).toContain("Food, games, and fun on the lawn.");
    expect(res.text).toContain("Attending:");
  });

  // success path: event detail contains required UI fields
  it("renders all required event detail fields in the response body", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.get("/events/event-published-1");

    expect(res.status).toBe(200);

    expect(res.text).toContain("Spring Picnic");
    expect(res.text).toContain("Food, games, and fun on the lawn.");
    expect(res.text).toContain("Campus Pond Lawn");
    expect(res.text).toContain("party");
    expect(res.text).toContain("Starts:");
    expect(res.text).toContain("Ends:");
  });

  // success path: role staff can view their own draft
  it("returns 200 when staff views their own draft event", async () => {
    const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
    const res = await agent.get("/events/event-draft-1");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Draft Planning Meeting");
  });

  // success path: role admin can view drafts
  it("returns 200 when admin views a draft event", async () => {
    const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await agent.get("/events/event-draft-1");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Draft Planning Meeting");
  });

  // error path: unauthenticated user should be redirected
  it("redirects unauthenticated users to /login", async () => {
    const res = await request(app).get("/events/event-published-1");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  // error path: event does not exist
  it("returns 404 for a non-existent event", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.get("/events/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.text).toContain("Event not found");
  });

  // error path: role user cannot view drafts
  it("does not allow an individual with role user to view a draft event", async () => {
    const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
    const res = await agent.get("/events/event-draft-1");

    expect(res.status).toBe(404);
  });
});