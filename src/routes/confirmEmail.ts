import { Request, Response } from "express"
import { User } from "../entity/User";
import { redis } from "../redis";

export const confirmEmail =  async (req: Request, res:Response) => {
    const { id } = req.params;

    const userId = await redis.get(id);
    if (userId) {
      const currentUser = await User.findOne({ where: { id: userId } });

      if (currentUser) {
        currentUser.confirmed = true;
        await User.save(currentUser);
        await redis.del(id);

        res.send("ok");
      }
    } else {
      res.send("invalid");
    }
  }