import axios from "axios";
import { Connection } from "typeorm";
import { createTypeormConnection } from "../../utils/createTypeormConnection";
import { User } from "../../entity/User";
import { TestClient } from "../../utils/TestClient";

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

let conn: Connection;

const email = "bob@email.com";
const password = "1231j2k3j13";
let userId: string;

const loginMutation = (e: string, p: string) => `
  mutation {
    login(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const meQuery = `{
  me {
    id
    email
  }
}`;

const logoutMutation = `
  mutation {
    logout
  }
`;

describe("logout", () => {
  test('multiple sessions', async () => {
    const session1 = new TestClient(process.env.TEST_HOST as string)
    const session2 = new TestClient(process.env.TEST_HOST as string)

    await session1.login(email, password)
    await session2.login(email, password)


    expect(await session1.me()).toEqual(await session2.me())

    await session1.logout()

    expect(await session1.me()).toEqual(await session2.me())
  })
  
  test("single session", async () => {
    await axios.post(
      process.env.TEST_HOST as string,
      {
        query: loginMutation(email, password)
      },
      { withCredentials: true }
    );

    const response = await axios.post(
      process.env.TEST_HOST as string,
      {
        query: meQuery
      },
      { withCredentials: true }
    );

    expect(response.data.data).toEqual({
      me: {
        id: userId,
        email
      }
    });

    const r = await axios.post(
      process.env.TEST_HOST as string,
      {
        query: logoutMutation
      },
      {
        withCredentials: true
      }
    );

    const response2 = await axios.post(
      process.env.TEST_HOST as string,
      {
        query: meQuery
      },
      {
        withCredentials: true
      }
    );

    expect(response2.data.data.me).toBeNull();
  });
});
