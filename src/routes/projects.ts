import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireWorkspaceRole } from "../services/authorization.js";
import { recordAudit } from "../services/audit.js";

const paramsSchema = z.object({
  workspaceId: z.string().min(1)
});

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  key: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,8}$/),
  description: z.string().trim().max(500).optional()
});

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.get("/workspaces/:workspaceId/projects", {
    preHandler: [app.authenticate],
    schema: { tags: ["Projects"], summary: "List workspace projects" }
  }, async (request) => {
    const { workspaceId } = paramsSchema.parse(request.params);
    await requireWorkspaceRole(request.user.sub, workspaceId);

    return prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  });

  app.post("/workspaces/:workspaceId/projects", {
    preHandler: [app.authenticate],
    schema: { tags: ["Projects"], summary: "Create project" }
  }, async (request, reply) => {
    const { workspaceId } = paramsSchema.parse(request.params);
    const input = createProjectSchema.parse(request.body);
    await requireWorkspaceRole(request.user.sub, workspaceId, "ADMIN");

    const project = await prisma.project.create({
      data: {
        workspaceId,
        name: input.name,
        key: input.key,
        description: input.description
      }
    });

    await recordAudit({
      actorId: request.user.sub,
      workspaceId,
      action: "project.created",
      entityType: "project",
      entityId: project.id,
      metadata: { key: project.key }
    });

    reply.code(201);
    return project;
  });
};
