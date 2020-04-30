import * as bcrypt from "bcryptjs";

import { ResolverMap } from "../../types/graphql-utils";
import { User } from "../../entity/User";
import errorMessages from "../../utils/errorMessages";
import { userSessionIdPrefix } from "../../../constants";

const errorResponse = (message: string) => [{ path: "email", message }];

export const resolvers: ResolverMap = {
  // Buq with devtools
  Query: {
    bye2: () => "bye"
  },
  Mutation: {
    login: async (
      _,
      { email, password }: GQL.ILoginOnMutationArguments,
      { session, redis, req }
    ) => {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return errorResponse(errorMessages["invalidLogin"]);
      }

      if (!user.confirmed) {
        return errorResponse(errorMessages["confirmEmail"]);
      }

      if (user.forgotPasswordLocked) {
        return errorResponse(errorMessages["accountLocked"]);
      }

      let valid;

      if (user.password) {
        valid = await bcrypt.compare(password, user.password);
      }

      if (!valid) {
        return errorResponse(errorMessages["invalidLogin"]);
      }

      // set session cookies
      session.userId = user.id;
      if (req.sessionID) {
        await redis.lpush(`${userSessionIdPrefix}${user.id}`, req.sessionID);
      }

      return null;
    }
  }
};
