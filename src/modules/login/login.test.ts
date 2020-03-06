import { request } from "graphql-request";
import errorMessages from "../../utils/errorMessages";
import { User } from "../../entity/User";
import { createTypeormConnection } from "../../utils/createTypeormConnection";
import { Connection } from "typeorm";

const email = "test@email.com";
const password = "1234";

let conn: Connection;

beforeAll(async () => {
  conn = await createTypeormConnection();
});

afterAll(async () => {
  conn.close();
});

const registerMutation = (e: string, p: string) => `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const loginMutation = (e: string, p: string) => `
  mutation {
    login(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const loginExpectCheck = async (e: string, p: string, errorMessage: string) => {
  const response = await request(
    process.env.TEST_HOST as string,
    loginMutation(e, p)
  );

  expect(response).toEqual({
    login: [{ path: "email", message: errorMessage }]
  });
};

describe("login", () => {
  test("email not found", async () => {
    await loginExpectCheck(
      "junk@email.com",
      "123",
      errorMessages["invalidLogin"]
    );
  });

  test("email not confirmed", async () => {
    await request(
      process.env.TEST_HOST as string,
      registerMutation(email, password)
    );

    await loginExpectCheck(email, password, errorMessages["confirmEmail"]);

    await User.update({ email }, { confirmed: true });

    await loginExpectCheck(email, "mess", errorMessages["invalidLogin"]);

    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation(email, password)
    );

    expect(response).toEqual({ login: null });
  });
});
