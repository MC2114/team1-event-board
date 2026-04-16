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
});
