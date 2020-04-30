import "reflect-metadata";
import { GraphQLServer } from "graphql-yoga";
import { createTypeormConnection } from "./utils/createTypeormConnection";
import { redis } from "./redis";
import * as session from "express-session";
import * as connectRedis from "connect-redis";
import * as passport from "passport";
import { Strategy } from "passport-google-oauth20";

import { confirmEmail } from "./routes/confirmEmail";
import { genSchema } from "./utils/generateSchema";
import { redisSessionPrefix } from "../constants";
import { User } from "./entity/User";

// TODO: Move to .env
const SESSION_SECRET = "bloob";
const GOOGLE_CLIENT_ID =
  "198091466196-eabbrdl9o0rh47vjh563l0gg794ekhe5.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "0uJJFsKsU1l755fqAJyBovki";

const RedisStore = connectRedis(session);

export const startServer = async () => {
  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({ request }) => ({
      redis,
      url: `${request.protocol}://${request.hostname}`,
      session: request.session,
      req: request
    })
  });

  server.express.use(
    session({
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix
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

  const connection = await createTypeormConnection();

  passport.use(
    new Strategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://lvh.me:4000/auth/google/callback"
      },
      async (_, __, profile, cb) => {
        const { id, emails } = profile;
        let email: string | null = null;

        const query = connection
          .getRepository(User)
          .createQueryBuilder("user")
          .where("user.googleId = :id", { id });

        if (emails) {
          email = emails[0].value;

          query.orWhere("user.email = :email", { email });
        }

        let user = await query.getOne();

        // register user
        if (!user) {
          user = await User.create({
            googleId: id,
            email
          }).save();
        } else if (!user.googleId) {
          // update existed user with googleId
          user.googleId = id;
          await user.save();
        } else {
          // login
        }

        return cb(undefined, { id: user.id });
      }
    )
  );

  server.express.use(passport.initialize());

  server.express.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  server.express.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
      (req.session as any).userId = (req.user as any).id;

      // redirect to frontend
      res.redirect("/");
    }
  );

  const app = await server.start({
    cors,
    port: process.env.NODE_ENV === "test" ? 0 : 4000
  });

  console.log("Server is running on localhost:4000");

  return app;
};
