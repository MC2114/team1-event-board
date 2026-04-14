import request from "supertest";
import { createComposedApp } from "../../src/composition";

describe("Event routes", () => {
  it("redirects unauthenticated users from /events to /login", async () => {
    const app = createComposedApp().getExpressApp();
    const response = await request(app).get("/events");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");
  });

  it("allows authenticated users to load /events", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    const loginResponse = await agent.post("/login").type("form").send({
      email: "admin@app.test",
      password: "password123",
    });

    expect(loginResponse.status).toBe(302);

    const response = await agent.get("/events").query({ searchQuery: "music" });

    expect(response.status).toBe(200);
    expect(response.text).toContain("Discover Events");
  });

  it("returns partial HTML for HTMX requests", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await agent.post("/login").type("form").send({
      email: "admin@app.test",
      password: "password123",
    });

    const response = await agent
      .get("/events")
      .set("HX-Request", "true")
      .query({ searchQuery: "music" });

    expect(response.status).toBe(200);
    expect(response.text).toContain("No matching events");
    expect(response.text).not.toContain("<!doctype html>");
  });
});
