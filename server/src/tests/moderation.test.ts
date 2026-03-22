import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin,
  promoteToAdmin,
  createOwnCocktail,
  register,
  login
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Moderation tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("submit for moderation changes status to pending", async () => {
    const user = makeUser("moderation_user");
    const token = await registerAndLogin(user);

    const cocktailId = await createOwnCocktail(token);

    const submitRes = await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.message).toBe("Submitted for moderation");

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${token}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("pending");
  });

  test("repeated submit for moderation returns conflict status", async () => {
    const user = makeUser("repeat_publish");
    const token = await registerAndLogin(user);

    const cocktailId = await createOwnCocktail(token);

    const firstRes = await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(firstRes.status).toBe(200);

    const secondRes = await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect([400, 409]).toContain(secondRes.status);
  });

  test("admin can approve pending cocktail and it appears in public feed", async () => {
    const user = makeUser("pending_user");
    const admin = makeUser("admin_user");

    const userToken = await registerAndLogin(user);
    const cocktailId = await createOwnCocktail(userToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${userToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const pendingRes = await request(app)
      .get("/api/admin/moderation/pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.length).toBe(1);
    expect(pendingRes.body[0].id).toBe(cocktailId);

    const approveRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);

    const publicRes = await request(app).get("/api/public");
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.length).toBe(1);
    expect(publicRes.body[0].source_cocktail_id).toBe(cocktailId);
    expect(publicRes.body[0].author_nickname).toBe(user.nickname);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("approved");
  });

  test("admin can reject pending cocktail with reason", async () => {
    const user = makeUser("reject_user");
    const admin = makeUser("reject_admin");

    const userToken = await registerAndLogin(user);
    const cocktailId = await createOwnCocktail(userToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${userToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const rejectRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Please improve instructions",
      });

    expect(rejectRes.status).toBe(200);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("rejected");
    expect(myRes.body[0].moderation_reason).toBe("Please improve instructions");
  });

  test("admin can return pending cocktail to draft with reason", async () => {
    const user = makeUser("cancel_user");
    const admin = makeUser("cancel_admin");

    const userToken = await registerAndLogin(user);
    const cocktailId = await createOwnCocktail(userToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${userToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const cancelRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/cancel`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Fix ingredient formatting",
      });

    expect(cancelRes.status).toBe(200);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("draft");
    expect(myRes.body[0].moderation_reason).toBe("Fix ingredient formatting");
  });

  test("admin can remove published cocktail with reason", async () => {
    const user = makeUser("remove_user");
    const admin = makeUser("remove_admin");

    const userToken = await registerAndLogin(user);
    const cocktailId = await createOwnCocktail(userToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${userToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    const removeRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/remove`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Publication rules violation",
      });

    expect(removeRes.status).toBe(200);

    const publicRes = await request(app).get("/api/public");
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.length).toBe(0);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("rejected");
    expect(myRes.body[0].moderation_reason).toBe("Publication rules violation");
  });
});