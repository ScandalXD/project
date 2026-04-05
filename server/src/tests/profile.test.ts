import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin,
  login,
  register
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

  test("user can change own password", async () => {
    const user = makeUser("change_password_user");

    await register(user);

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    const changeRes = await request(app)
    .put("/api/profile/password")
    .set("Authorization", `Bearer ${token}`)
    .send({
      currentPassword: user.password,
      newPassword: "newpassword123",
    });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.message).toBe("Password updated");

    const oldLoginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await login({
      email: user.email,
      password: "newpassword123",
    });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.token).toBeTruthy();
  });

  test("cannot change password with wrong current password", async () => {
    const user = makeUser("wrong_current_password_user");

    await register(user);

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    const changeRes = await request(app)
    .put("/api/profile/password")
    .set("Authorization", `Bearer ${token}`)
    .send({
      currentPassword: "wrongpassword",
      newPassword: "newpassword123",
    });

    expect(changeRes.status).toBe(401);
    expect(changeRes.body.message).toBe("Current password is incorrect");
  });

  test("cannot change password to same password", async () => {
    const user = makeUser("same_password_user");

    await register(user);

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    const changeRes = await request(app)
    .put("/api/profile/password")
    .set("Authorization", `Bearer ${token}`)
    .send({
      currentPassword: user.password,
      newPassword: user.password,
    });

    expect(changeRes.status).toBe(400);
    expect(changeRes.body.message).toBe(
      "New password must be different from current password"
    );
  });

  test("cannot change password without token", async () => {
    const res = await request(app)
    .put("/api/profile/password")
    .send({
      currentPassword: "123456",
      newPassword: "newpassword123",
    });

    expect(res.status).toBe(401);
  });

  test("cannot change password with too short new password", async () => {
    const user = makeUser("short_new_password_user");

    await register(user);

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    const changeRes = await request(app)
      .put("/api/profile/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: user.password,
        newPassword: "123",
      });

    expect(changeRes.status).toBe(400);
    expect(changeRes.body.message).toBe(
      "New password must be at least 6 characters long"
    );
  });
});