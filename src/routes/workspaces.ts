import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { recordAudit } from "../services/audit.js";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,50}$/)
});

export const workspaceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/workspaces", {
    preHandler: [app.authenticate],
    schema: { tags: ["Workspaces"], summary: "List my workspaces" }
  }, async (request) => {
    return prisma.workspace.findMany({
      where: { members: { some: { userId: request.user.sub } } },
      include: {
        members: {
          where: { userId: request.user.sub },
          select: { role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  });

  app.post("/workspaces", {
    preHandler: [app.authenticate],
    schema: { tags: ["Workspaces"], summary: "Create workspace" }
  }, async (request, reply) => {
    const input = createWorkspaceSchema.parse(request.body);

    const workspace = await prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: {
            create: {
              userId: request.user.sub,
              role: "OWNER"
            }
          }
        }
      });

      return created;
    });

    await recordAudit({
      actorId: request.user.sub,
      workspaceId: workspace.id,
      action: "workspace.created",
      entityType: "workspace",
      entityId: workspace.id
    });

    reply.code(201);
    return workspace;
  });
};
