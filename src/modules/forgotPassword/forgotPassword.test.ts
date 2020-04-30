import * as Redis from "ioredis";
import { Connection } from "typeorm";
import { createTypeormConnection } from "../../utils/createTypeormConnection";
import { User } from "../../entity/User";
import { TestClient } from "../../utils/TestClient";
import { createForgotPasswordLink } from "../../utils/createForgotPasswordLink";
import { forgotPasswordLockAccount } from "../../utils/forgotPasswordLockAccount";
import errorMessages from "../../utils/errorMessages";

beforeAll(async () => {
  conn = await createTypeormConnection();
  const user = await User.create({
    email,
    password,
    confirmed: true
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

const redis = new Redis();
let conn: Connection;

const email = "bob@email.com";
const password = "1231j2k3j13";
const newPassword = "sdkjfsfdjasf";
let userId: string;

describe("forgot password", () => {
  test("should work", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    // lock user account
    await forgotPasswordLockAccount(userId, redis);
    const url = await createForgotPasswordLink("", userId, redis);

    const parts = url.split("/");
    const key = parts[parts.length - 1];

    // make sure we can't login
    expect(await client.login(email, password)).toEqual({
      data: {
        login: [{ path: "email", message: errorMessages["accountLocked"] }]
      }
    });

    const response = await client.forgotPasswordChange(newPassword, key);

    // make sure redis key expires after password change
    expect(await client.forgotPasswordChange("dfjasldkjfasdf", key)).toEqual({
      data: {
        forgotPasswordChange: [
          { path: "key", message: errorMessages["expiredKey"] }
        ]
      }
    });

    expect(response.data).toEqual({
      forgotPasswordChange: null
    });

    expect(await client.login(email, newPassword)).toEqual({
      data: { login: null }
    });
  });
});
