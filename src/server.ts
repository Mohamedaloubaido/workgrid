import { buildApp } from "./app.js";
import { env } from "./config.js";
import { prisma } from "./lib/prisma.js";

const app = await buildApp();

async function shutdown(signal: string) {
  app.log.info({ signal }, "Shutting down");
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({
  port: env.PORT,
  host: "0.0.0.0"
});
