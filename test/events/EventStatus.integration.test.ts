import { request } from "http";
import { createComposedApp } from "../../src/composition";
import { loginAs } from "../helper/auth";

describe("Feature 2: Event Publishing and Cancellation", () => {
  const app = createComposedApp().getExpressApp();

  const USER_EMAIL = "user@app.test";
  const USER_PASSWORD = "password123";

  const STAFF_EMAIL = "staff@app.test";
  const STAFF_PASSWORD = "password123";

  const ADMIN_EMAIL = "admin@app.test";
  const ADMIN_PASSWORD = "password123";

  function getApp(){
    return createComposedApp().getExpressApp();
  }

  it("returns 302 to dashboard when staff publishes their own draft via regular form submission", async () => {
    const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
    const res = await agent.post(`/events/event-draft-1/publish`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/events/dashboard");
  });

  it("returns 200 with status controls partial when staff publishes via HTMX request", async () => {
    const app = getApp();
    const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
    const res = await agent.post(`/events/event-draft-1/publish`).set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("event-status-controls");
    expect(res.text).toContain("Publish Event");
  });

  it("returns 302 to dashboard when staff cancels their own published event via regular form submission", async () => {
    const app = getApp();
    const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
    const res = await agent.post(`/events/event-published-1/cancel`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/events/dashboard");
  });
  
  
  it("returns 200 with status controls partial when staff cancels via HTMX request", async () => {
    const app = getApp();
    const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
    const res = await agent.post(`/events/event-published-1/cancel`).set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("event-status-controls");
    expect(res.text).toContain("Cancel Event");
  });
  
  it("returns 302 to dashboard when admin publishes their own draft via regular form submission", async () => {
    const app = getApp();
    const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await agent.post(`/events/event-draft-1/publish`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/events/dashboard");
  });

  it("returns 200 with status controls partial when admin publishes via HTMX request", async () => {
    const app = getApp();
    const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await agent.post(`/events/event-draft-1/publish`).set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("event-status-controls");
    expect(res.text).toContain("Publish Event");
  });
  
  it("returns 302 to dashboard when admin cancels their own published event via regular form submission", async () => {
    const app = getApp();
    const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await agent.post(`/events/event-published-1/cancel`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/events/dashboard");
  });
  
  it("returns 200 with status controls partial when admin cancels via HTMX request", async () => {
    const app = getApp();
    const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await agent.post(`/events/event-published-1/cancel`).set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("event-status-controls");
    expect(res.text).toContain("Cancel Event");
  });

  it("redirects unauthenticated user to login when publishing", async () => {
    const app = getApp();
    const res = await request(app).post(`/events/event-draft-1/publish`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  
});