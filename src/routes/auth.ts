import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1)
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", {
    schema: { tags: ["Auth"], summary: "Register user" }
  }, async (request, reply) => {
    const input = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "Email already registered", "EMAIL_TAKEN");

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 12)
      },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    reply.code(201);
    return { user, token };
  });

  app.post("/auth/login", {
    schema: { tags: ["Auth"], summary: "Login user" }
  }, async (request, reply) => {
    const input = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = await reply.jwtSign({ sub: user.id, email: user.email });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token
    };
  });
};
