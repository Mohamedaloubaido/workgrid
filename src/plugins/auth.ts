import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "../config.js";

export default fp(async function authPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: "1h" }
  });

  app.decorate("authenticate", async function (request: FastifyRequest) {
    await request.jwtVerify();
  });
});
