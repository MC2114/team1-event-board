import request from "supertest";
import { Express } from "express";
import { createComposedApp } from "../../src/composition";
import { loginAs } from "../helper/auth";

describe("Feature 6: Category and Date Filter", () => {
    let app: Express;

    beforeEach(() => {
        app = createComposedApp().getExpressApp();
    });

    const USER_EMAIL = "user@app.test";
    const USER_PASSWORD = "password123";

    const STAFF_EMAIL = "staff@app.test";
    const STAFF_PASSWORD = "password123";

    const ADMIN_EMAIL = "admin@app.test";
    const ADMIN_PASSWORD = "password123";

    it("returns 200 with all published events when no filters applied", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Spring Picnic");
    });

    it("returns 200 and filters by valid category", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").query({ category: "party" });
        expect(res.status).toBe(200);
        expect(res.text).toContain("Spring Picnic");
    });

    it("returns 200 when filtering by category with no results", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").query({ category: "art" });
        expect(res.status).toBe(200);
        expect(res.text).toContain("No events found");
    });

    it("returns 200 and filters by valid timeframe", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").query({ timeframe: "this_year" });
        expect(res.status).toBe(200);
        expect(res.text).toContain("Spring Picnic");
    });

    it("returns 200 and filters by both category and timeframe", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").query({ category: "party", timeframe: "this_year" });
        expect(res.status).toBe(200);
        expect(res.text).toContain("Spring Picnic");
    });

    it("does not show draft events to regular users", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events")
        expect(res.status).toBe(200);
        expect(res.text).not.toContain("Draft Planning Meeting");
    });

    it("shows draft events to staff users", async () => {
        const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
        const res = await agent.get("/events").query({ category: "networking"});
        expect(res.status).toBe(200);
        expect(res.text).toContain("Draft Planning Meeting");
    });

    it("shows draft events to admin users", async () => {
        const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
        const res = await agent.get("/events").query({ category: "networking"});
        expect(res.status).toBe(200);
        expect(res.text).toContain("Draft Planning Meeting");
    });

    it("shows staff their own drafts alongside published upcoming events", async () => {
        const agent = await loginAs(app, STAFF_EMAIL, STAFF_PASSWORD);
        const res = await agent.get("/events");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Draft Planning Meeting");
        expect(res.text).toContain("Spring Picnic");
    });

    it("shows admin all events, including drafts and cancelled events", async () => {
        const agent = await loginAs(app, ADMIN_EMAIL, ADMIN_PASSWORD);
        const res = await agent.get("/events");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Draft Planning Meeting");
        expect(res.text).toContain("Cancelled Hackathon");
    });

    it("returns HTMX partila when HX-Request header is present", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").set("HX-Request", "true").query({ category: "party" });
        expect(res.status).toBe(200);
        expect(res.text).not.toContain("<!doctype html>");
        expect(res.text).toContain("Spring Picnic");
    });

    it("returns partial without layout when HTMX request has no matching events", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").set("HX-Request", "true").query({ category: "gaming" });
        expect(res.status).toBe(200);
        expect(res.text).not.toContain("<!doctype html>");
        expect(res.text).toContain("No events found");
    });

    it("return 200 for an invalid category filter", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").query({ category: "invalid" });
        expect(res.status).toBe(200);
    });

    it("return 200 for an invalid timeframe filter", async () => {
        const agent = await loginAs(app, USER_EMAIL, USER_PASSWORD);
        const res = await agent.get("/events").query({ timeframe: "invalid" });
        expect(res.status).toBe(200);
    });

    it("redirects to login page for unauthenticated users", async () => {
        const res = await request(app).get("/events");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });
});