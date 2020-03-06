import { createConfirmEmailLink } from "./createConfirmEmailLink";
import { createTypeormConnection } from "./createTypeormConnection";
import { User } from "../entity/User";
import * as Redis from "ioredis";
import fetch from "node-fetch";
import { Connection } from "typeorm";

let userId = "";
const redis = new Redis();

let conn: Connection;

beforeAll(async () => {
  conn = await createTypeormConnection();
  const user = await User.create({
    email: "bob@email.com",
    password: "1231j2k3j13"
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe("createConfirmEmailLink", () => {
  it("should confirm user", async () => {
    const url = await createConfirmEmailLink(
      process.env.TEST_HOST as string,
      userId as string,
      redis
    );

    const response = await fetch(url);

    const text = await response.text();
    expect(text).toEqual("ok");
  });

  it("should send invalid back when bad id", async () => {
    const response = await fetch(`${process.env.TEST_HOST}/confirm/3123412412`);

    const text = await response.text();
    expect(text).toEqual("invalid");
  });
});
