import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import { 
    makeUser, 
    resetDatabase, 
    register, 
    login 
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Auth tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("register and login work", async () => {
    const user = makeUser("user1");

    const registerRes = await register(user);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeTruthy();
    expect(registerRes.body.user.email).toBe(user.email);
    expect(registerRes.body.user.nickname).toBe(user.nickname);
    expect(registerRes.body.user.role).toBe("user");

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user.email).toBe(user.email);
  });

  test("registration with empty data returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "",
      password: "",
      name: "",
      nickname: "",
    });

    expect(res.status).toBe(400);
  });

  test("login with wrong password returns 401", async () => {
    const user = makeUser("wrongpass");

    await register(user);

    const res = await login({
      email: user.email,
      password: "wrong_password",
    });

    expect(res.status).toBe(401);
  });
});