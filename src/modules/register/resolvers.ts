import * as bcrypt from "bcryptjs";
import * as yup from "yup"

import { ResolverMap } from "../../types/graphql-utils";
import { User } from "../../entity/User";
import { formatYupError } from "../../utils/formatYupError";
import errorMessages from "../../utils/errorMessages"

const schema = yup.object().shape({
  email: yup.string().min(3, errorMessages["emailNotLongEnough"]).max(255).email(errorMessages["emailNotValid"]),
  password: yup.string().min(3, errorMessages["passwordNotLongEnough"]).max(255)
})

export const resolvers: ResolverMap = {
  // Buq with devtools
  Query: {
    bye: () => "bye"
  },
  Mutation: {
    register: async (
      _,
      args: GQL.IRegisterOnMutationArguments
    ) => {
      try {
        await schema.validate(args, {abortEarly: false})
      } catch (err) {
        return formatYupError(err)
      }

      const {email, password} = args
      const userExists = await User.findOne({where: {email}, select: ["id"]})

      if (userExists) {
        return [{
          path: "email",
          message: errorMessages["duplicateEmail"]
        }]
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = User.create({
        email,
        password: hashedPassword
      });
      await user.save();

      return null;
    }
  }
};
