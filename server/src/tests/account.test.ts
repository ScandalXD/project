import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin,
  promoteToAdmin,
  register,
  login
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Account tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("user can delete own account", async () => {
    const user = makeUser("delete_self_user");
    const token = await registerAndLogin(user);

    const deleteRes = await request(app)
      .delete("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Account deleted");

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(401);
  });

  test("admin can delete own account if not the last admin", async () => {
    const admin1 = makeUser("admin_delete_1");
    const admin2 = makeUser("admin_delete_2");

    await register(admin1);
    await register(admin2);

    await promoteToAdmin(admin1.email);
    await promoteToAdmin(admin2.email);

    const admin1Login = await login({
      email: admin1.email,
      password: admin1.password,
    });

    const admin1Token = admin1Login.body.token as string;

    const deleteRes = await request(app)
      .delete("/api/profile")
      .set("Authorization", `Bearer ${admin1Token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Account deleted");

    const loginRes = await login({
      email: admin1.email,
      password: admin1.password,
    });

    expect(loginRes.status).toBe(401);
  });

  test("last admin cannot delete own account", async () => {
    const admin = makeUser("last_admin");

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const deleteRes = await request(app)
      .delete("/api/profile")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(409);
    expect(deleteRes.body.message).toBe(
      "You cannot delete the last admin account",
    );
  });
});