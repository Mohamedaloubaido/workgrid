import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { recordAudit } from "../services/audit.js";
import { requireWorkspaceRole } from "../services/authorization.js";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,50}$/)
});

const paramsSchema = z.object({
  workspaceId: z.string().min(1)
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
        },
        _count: { select: { projects: true, members: true } }
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
      return tx.workspace.create({
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

  app.get("/workspaces/:workspaceId/members", {
    preHandler: [app.authenticate],
    schema: { tags: ["Workspaces"], summary: "List workspace members" }
  }, async (request) => {
    const { workspaceId } = paramsSchema.parse(request.params);
    await requireWorkspaceRole(request.user.sub, workspaceId);

    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "asc" }
    });
  });

  app.get("/workspaces/:workspaceId/activity", {
    preHandler: [app.authenticate],
    schema: { tags: ["Workspaces"], summary: "List recent workspace activity" }
  }, async (request) => {
    const { workspaceId } = paramsSchema.parse(request.params);
    await requireWorkspaceRole(request.user.sub, workspaceId);

    return prisma.auditLog.findMany({
      where: { workspaceId },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  });
};
