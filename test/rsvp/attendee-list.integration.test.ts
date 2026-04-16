import request, { type SuperAgentTest } from "supertest";
import { createComposedApp } from "../../src/composition";

async function login(
  agent: SuperAgentTest,
  email: string,
  password = "password123",
): Promise<void> {
  const response = await agent
    .post("/login")
    .type("form")
    .send({ email, password });

  expect(response.status).toBe(302);
}

describe("Feature 12 Sprint 2 - Attendee List integration", () => {
  it("allows staff organizer to view attendee list for their own event", async () => {
    const app = createComposedApp().getExpressApp();
    const staffAgent = request.agent(app);

    await login(staffAgent, "staff@app.test");
    const response = await staffAgent.get("/events/event-published-1/attendees");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Attendee List");
    expect(response.text).toContain("Going");
    expect(response.text).toContain("Waitlisted");
    expect(response.text).toContain("Cancelled");
  });

  it("shows attendee display names in attendee rows", async () => {
    const app = createComposedApp().getExpressApp();
    const staffAgent = request.agent(app);

    await login(staffAgent, "staff@app.test");
    const response = await staffAgent.get("/events/event-published-1/attendees");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Una User");
    expect(response.text).toContain("Avery Admin");
    expect(response.text).toContain("Sam Staff");
  });

  it("returns attendees sorted by createdAt ascending within each group", async () => {
    const app = createComposedApp().getExpressApp();
    const staffAgent = request.agent(app);

    await login(staffAgent, "staff@app.test");
    const response = await staffAgent.get("/events/event-published-1/attendees");

    expect(response.status).toBe(200);

    const goingSectionMatch = response.text.match(/<h2 class="text-xl font-semibold text-slate-900 mb-3">Going<\/h2>([\s\S]*?)<\/section>/);
    expect(goingSectionMatch).not.toBeNull();

    const goingSection = goingSectionMatch![1];
    const unaUserPosition = goingSection.indexOf("Una User");
    const samStaffPosition = goingSection.indexOf("Sam Staff");

    expect(unaUserPosition).toBeGreaterThanOrEqual(0);
    expect(samStaffPosition).toBeGreaterThanOrEqual(0);
    expect(unaUserPosition).toBeLessThan(samStaffPosition);
  });

  it("allows admin to view attendee list for any event", async () => {
    const app = createComposedApp().getExpressApp();
    const adminAgent = request.agent(app);

    await login(adminAgent, "admin@app.test");
    const response = await adminAgent.get("/events/event-published-1/attendees");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Attendee List");
  });
});
