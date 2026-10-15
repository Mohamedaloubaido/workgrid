import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", {
    schema: {
      tags: ["System"],
      summary: "Health check"
    }
  }, async () => ({
    ok: true,
    service: "workgrid-api",
    timestamp: new Date().toISOString()
  }));
};
