import { PrismaClient, WorkspaceRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@workgrid.dev" },
    update: {},
    create: {
      email: "demo@workgrid.dev",
      name: "Demo User",
      passwordHash
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Workspace",
      slug: "acme",
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER
        }
      }
    }
  });

  await prisma.project.upsert({
    where: {
      workspaceId_key: {
        workspaceId: workspace.id,
        key: "WEB"
      }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Website Redesign",
      key: "WEB",
      description: "Demo project for the Workgrid portfolio API."
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
