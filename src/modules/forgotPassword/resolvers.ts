import * as yup from "yup";
import * as bcrypt from "bcryptjs";

import { ResolverMap } from "../../types/graphql-utils";
import { forgotPasswordLockAccount } from "../../utils/forgotPasswordLockAccount";
import { createForgotPasswordLink } from "../../utils/createForgotPasswordLink";
import { User } from "../../entity/User";
import errorMessages from "../../utils/errorMessages";
import { forgotPasswordPrefix } from "../../../constants";
import { formatYupError } from "../../utils/formatYupError";

const schema = yup.object().shape({
  newPassword: yup
    .string()
    .min(3, errorMessages["passwordNotLongEnough"])
    .max(255)
});

export const resolvers: ResolverMap = {
  // Buq with devtools
  Query: {
    forgotFake: () => "fake"
  },
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      __,
      { redis }
    ) => {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return [{ path: "email", message: errorMessages["userNotFound"] }];
      }

      await forgotPasswordLockAccount(user.id, redis);

      // TODO: add frontend url
      await createForgotPasswordLink("", user.id, redis);

      // TODO: send email with the url

      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;

      const userId = await redis.get(redisKey);

      if (!userId) {
        return [
          {
            path: "key",
            message: errorMessages["expiredKey"]
          }
        ];
      }

      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const hashPassword = await bcrypt.hash(newPassword, 10);

      User.update(
        { id: userId },
        { forgotPasswordLocked: false, password: hashPassword }
      );

      await redis.del(redisKey);
      return null;
    }
  }
};
