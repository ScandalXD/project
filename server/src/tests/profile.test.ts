import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Profile tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("protected route without token returns 401", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
  });

  test("profile get and update work", async () => {
    const user = makeUser("profile");
    const token = await registerAndLogin(user);

    const profileRes = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.email).toBe(user.email);
    expect(profileRes.body.nickname).toBe(user.nickname);

    const updateRes = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
        nickname: "updated_nickname_1",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.token).toBeTruthy();
    expect(updateRes.body.user.name).toBe("Updated Name");
    expect(updateRes.body.user.nickname).toBe("updated_nickname_1");
  });
});