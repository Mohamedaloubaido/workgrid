import { beforeAll, afterAll, describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/workgrid_test?schema=public";
process.env.JWT_SECRET = "test-secret-that-is-definitely-longer-than-thirty-two-characters";
process.env.CORS_ORIGIN = "http://localhost:3000";

const { buildApp } = await import("../src/app.js");

describe("health route", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns service health", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      service: "workgrid-api"
    });
  });
});
