import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "./config.js";
import authPlugin from "./plugins/auth.js";
import { AppError } from "./lib/errors.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { workspaceRoutes } from "./routes/workspaces.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== "test"
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Workgrid API",
        description: "Project management SaaS API demonstrating authentication, RBAC, PostgreSQL, audit logging and production-minded backend design.",
        version: "0.1.0"
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });

  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(workspaceRoutes);
  await app.register(projectRoutes);
  await app.register(taskRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: "Invalid request",
        details: error.issues
      });
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.code(409).send({
          error: "CONFLICT",
          message: "A record with the same unique value already exists"
        });
      }
    }

    app.log.error(error);
    return reply.code(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong"
    });
  });

  return app;
}
