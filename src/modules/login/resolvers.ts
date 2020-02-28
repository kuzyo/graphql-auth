import * as bcrypt from "bcryptjs";

import { ResolverMap } from "../../types/graphql-utils";
import { User } from "../../entity/User";
import errorMessages from "../../utils/errorMessages";

const errorResponse = (message: string) => [{ path: "email", message }];

export const resolvers: ResolverMap = {
  // Buq with devtools
  Query: {
    bye2: () => "bye"
  },
  Mutation: {
    login: async (_, { email, password }: GQL.ILoginOnMutationArguments) => {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return errorResponse(errorMessages["invalidLogin"]);
      }

      if (!user.confirmed) {
        return errorResponse(errorMessages["confirmEmail"]);
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return errorResponse(errorMessages["invalidLogin"]);
      }

      return null;
    }
  }
};
