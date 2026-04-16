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

async function createAndPublishEvent(
  staffAgent: SuperAgentTest,
  title: string,
): Promise<string> {
  const createResponse = await staffAgent
    .post("/events/new")
    .type("form")
    .send({
      title,
      description: "Integration test event for search.",
      location: "Engineering Hall",
      category: "technology",
      capacity: "25",
      startDatetime: "2099-06-15T18:00",
      endDatetime: "2099-06-15T20:00",
    });

  expect(createResponse.status).toBe(302);

  const locationHeader = createResponse.header.location as string;
  const idMatch = locationHeader.match(/^\/events\/([^/]+)$/);
  expect(idMatch).not.toBeNull();

  const eventId = idMatch![1];
  const publishResponse = await staffAgent.post(`/events/${eventId}/publish`);
  expect(publishResponse.status).toBe(302);

  return eventId;
}

describe("Feature 10 Sprint 2 - Event Search integration", () => {
  it("returns matching results for a valid search query", async () => {
    const app = createComposedApp().getExpressApp();
    const staffAgent = request.agent(app);
    const userAgent = request.agent(app);

    await login(staffAgent, "staff@app.test");
    const uniqueTitle = "Search Match Sprint Two Event";
    await createAndPublishEvent(staffAgent, uniqueTitle);

    await login(userAgent, "user@app.test");
    const response = await userAgent.get("/events").query({ searchQuery: "sprint two event" });

    expect(response.status).toBe(200);
    expect(response.text).toContain(uniqueTitle);
  });

  it("returns no-results state when query has no matches", async () => {
    const app = createComposedApp().getExpressApp();
    const userAgent = request.agent(app);

    await login(userAgent, "user@app.test");
    const response = await userAgent
      .get("/events")
      .query({ searchQuery: "no-match-abcxyz-12345" });

    expect(response.status).toBe(200);
    expect(response.text).toContain("No events found.");
  });
});
