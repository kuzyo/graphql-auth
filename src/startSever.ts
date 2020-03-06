import "reflect-metadata";
import { GraphQLServer } from "graphql-yoga";
import { createTypeormConnection } from "./utils/createTypeormConnection";
import { redis } from "./redis";
import * as session from "express-session";
import * as connectRedis from "connect-redis";

import { confirmEmail } from "./routes/confirmEmail";
import { genSchema } from "./utils/generateSchema";

// TODO: Move to .env
const SESSION_SECRET = "bloob";
const RedisStore = connectRedis(session);

export const startServer = async () => {
  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({ request }) => ({
      redis,
      url: `${request.protocol}://${request.hostname}`,
      session: request.session
    })
  });

  server.express.use(
    session({
      store: new RedisStore({
        client: redis as any
      }),
      name: "qid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    })
  );

  const cors = {
    credentials: true,
    origin: process.env.NODE_ENV === "test" ? "*" : "http://localhost:3000" // TODO: Move to .env
  };

  server.express.get("/confirm/:id", confirmEmail);

  await createTypeormConnection();
  const app = await server.start({
    cors,
    port: process.env.NODE_ENV === "test" ? 0 : 4000
  });

  console.log("Server is running on localhost:4000");

  return app;
};
