import { Redis } from "ioredis";
import { removeUserSessions } from "./removeUserSessions";
import { User } from "../entity/User";

export const forgotPasswordLockAccount = async (
  userId: string,
  redis: Redis
) => {
  await User.update({ id: userId }, { forgotPasswordLocked: true });
  await removeUserSessions(userId, redis);
};
