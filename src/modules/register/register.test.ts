import { request } from "graphql-request";
import errorMessages from "../../utils/errorMessages";
import { Connection } from "typeorm";
import { createTypeormConnection } from "../../utils/createTypeormConnection";

const email = "test@email.com";
const password = "1234";

let conn: Connection;

beforeAll(async () => {
  conn = await createTypeormConnection();
});

afterAll(async () => {
  conn.close();
});

const mutation = (e: string, p: string) => `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

describe("Register user", () => {
  it("make sure we can register", async () => {
    const response: any = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    expect(response).toEqual({ register: null });
  });

  it("should check for no long enough email", async () => {
    const response: any = await request(
      process.env.TEST_HOST as string,
      mutation("b", password)
    );
    expect(response).toEqual({
      register: [
        {
          path: "email",
          message: errorMessages["emailNotLongEnough"]
        },
        {
          path: "email",
          message: errorMessages["emailNotValid"]
        }
      ]
    });
  });

  it("should check for bad email", async () => {
    const response = await request(
      process.env.TEST_HOST as string,
      mutation("bddd.ddd.com", password)
    );
    expect(response).toEqual({
      register: [{ path: "email", message: errorMessages["emailNotValid"] }]
    });
  });
});
