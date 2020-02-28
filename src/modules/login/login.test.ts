import { request } from "graphql-request";
import errorMessages from "../../utils/errorMessages";

// const email = "test@email.com";
// const password = "1234";

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

describe("login", () => {
  test("should login", async () => {
    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation("junk@email.com", "123")
    );

    expect(response).toEqual({
      login: [{ path: "email", message: errorMessages["invalidLogin"] }]
    });
  });
});
