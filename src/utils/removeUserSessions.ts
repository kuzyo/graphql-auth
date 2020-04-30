import { Redis } from "ioredis";
import { userSessionIdPrefix, redisSessionPrefix } from "../../constants";

export const removeUserSessions = async (userId: string, redis: Redis) => {
  const sessionIds = await redis.lrange(
    `${userSessionIdPrefix}${userId}`,
    0,
    -1
  );
  const promises = [];
  for (let index = 0; index < sessionIds.length; index++) {
    promises.push(redis.del(`${redisSessionPrefix}${sessionIds[index]}`));
  }
  await Promise.all(promises);
};
