import { WorkspaceRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";

const rank: Record<WorkspaceRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3
};

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  minimum: WorkspaceRole = "MEMBER"
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId }
    }
  });

  if (!membership) {
    throw new AppError(403, "You are not a member of this workspace", "FORBIDDEN");
  }

  if (rank[membership.role] < rank[minimum]) {
    throw new AppError(403, "Insufficient workspace permissions", "FORBIDDEN");
  }

  return membership;
}
