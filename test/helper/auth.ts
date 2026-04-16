import request from "supertest";
import type express from "express";

export async function loginAs(
  app: express.Express,
  email: string,
  password: string,
) {
  const agent = request.agent(app);

  await agent
    .post("/login")
    .type("form")
    .send({ email, password });

  return agent;
}