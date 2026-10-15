import { prisma } from "../lib/prisma.js";

type AuditMetadataValue = string | number | boolean | null | string[];

export async function recordAudit(input: {
  actorId: string;
  workspaceId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, AuditMetadataValue>;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata
    }
  });
}
