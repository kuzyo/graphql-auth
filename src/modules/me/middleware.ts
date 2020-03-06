import { Resolver } from "../../types/graphql-utils";

export default async (
  resolver: Resolver,
  parent: any,
  args: any,
  context: any,
  info: any
) => {
  // check permission - in case we need it
  // const user = await User.findOne({ where: { id: context.session.userId } });

  // if (!user.admin) {
  //   throw Error("not admin");
  // }

  const result = await resolver(parent, args, context, info);

  return result;
};
