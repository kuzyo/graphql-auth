import { request } from "graphql-request";
import { User } from "../../entity/User";
import { startServer } from "../../startSever";
import { AddressInfo } from 'net'
import errorMessages from "../../utils/errorMessages";

const email = "test@email.com";
const password = "1234";

const mutation = (e:string , p:string ) =>  `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

let getHost = () => ""

beforeAll(async () => {
  const app = await startServer()
  const { port } = app.address() as AddressInfo;

  getHost = () => `http://127.0.0.1:${port}`
  
});

test("Register user", async () => {
  // make sure we can register a user
  const response = await request(getHost(), mutation(email,password));
  expect(response).toEqual({ register: null });
  const user = await User.find({ where: { email } });
  expect(user).toHaveLength(1);

  // catch duplicate emails
  const response2 = await request(getHost(), mutation(email, password));
  expect(response2).toEqual({ register: [{path: "email", message: errorMessages["duplicateEmail"]}] });

  // catch bad email
  const response3 = await request(getHost(), mutation("bddd.ddd.com", password));
  expect(response3).toEqual({ register: [{path: "email", message: errorMessages["emailNotValid"]}] });
});
