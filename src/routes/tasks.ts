import type { FastifyPluginAsync } from "fastify";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { requireWorkspaceRole } from "../services/authorization.js";
import { recordAudit } from "../services/audit.js";

const projectParams = z.object({ projectId: z.string().min(1) });
const taskParams = z.object({ taskId: z.string().min(1) });

const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assigneeId: z.string().optional()
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().nullable().optional()
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

async function loadProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND");
  return project;
}

export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.get("/projects/:projectId/tasks", {
    preHandler: [app.authenticate],
    schema: { tags: ["Tasks"], summary: "List project tasks" }
  }, async (request) => {
    const { projectId } = projectParams.parse(request.params);
    const project = await loadProject(projectId);
    await requireWorkspaceRole(request.user.sub, project.workspaceId);

    return prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, email: true } }
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }]
    });
  });

  app.post("/projects/:projectId/tasks", {
    preHandler: [app.authenticate],
    schema: { tags: ["Tasks"], summary: "Create task" }
  }, async (request, reply) => {
    const { projectId } = projectParams.parse(request.params);
    const input = createTaskSchema.parse(request.body);
    const project = await loadProject(projectId);
    await requireWorkspaceRole(request.user.sub, project.workspaceId);

    if (input.assigneeId) {
      await requireWorkspaceRole(input.assigneeId, project.workspaceId);
    }

    const task = await prisma.task.create({
      data: { projectId, ...input }
    });

    await recordAudit({
      actorId: request.user.sub,
      workspaceId: project.workspaceId,
      action: "task.created",
      entityType: "task",
      entityId: task.id
    });

    reply.code(201);
    return task;
  });

  app.patch("/tasks/:taskId", {
    preHandler: [app.authenticate],
    schema: { tags: ["Tasks"], summary: "Update task" }
  }, async (request) => {
    const { taskId } = taskParams.parse(request.params);
    const input = updateTaskSchema.parse(request.body);

    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!existing) throw new AppError(404, "Task not found", "TASK_NOT_FOUND");
    await requireWorkspaceRole(request.user.sub, existing.project.workspaceId);

    if (input.assigneeId) {
      await requireWorkspaceRole(input.assigneeId, existing.project.workspaceId);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: input
    });

    await recordAudit({
      actorId: request.user.sub,
      workspaceId: existing.project.workspaceId,
      action: "task.updated",
      entityType: "task",
      entityId: task.id,
      metadata: { changedFields: Object.keys(input) }
    });

    return task;
  });
};
