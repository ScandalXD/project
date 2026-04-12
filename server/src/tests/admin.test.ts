import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  register,
  login,
  registerAndLogin,
  promoteToAdmin,
  createOwnCocktail,
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Admin access tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("non-admin cannot access admin moderation routes", async () => {
    const user = makeUser("not_admin");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .get("/api/admin/moderation/pending")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("non-admin cannot add catalog cocktail", async () => {
    const user = makeUser("catalog_non_admin");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .post("/api/admin/catalog")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: `forbidden-${Date.now()}`,
        name: "Forbidden Cocktail",
        category: "Alkoholowy",
        ingredients: "A, B",
        instructions: "Mix",
        image: "assets/cocktails/alcoholic/forbidden.jpg",
      });

    expect(res.status).toBe(403);
  });

  test("admin can get all users", async () => {
    const user1 = makeUser("admin_users_1");
    const user2 = makeUser("admin_users_2");
    const admin = makeUser("admin_users_admin");

    await register(user1);
    await register(user2);
    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const nicknames = res.body.map((u: any) => u.nickname);

    expect(nicknames).toContain(user1.nickname);
    expect(nicknames).toContain(user2.nickname);
    expect(nicknames).toContain(admin.nickname);
  });

  test("non-admin cannot get all users", async () => {
    const user = makeUser("admin_users_forbidden");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("admin can get system stats", async () => {
    const user = makeUser("admin_stats_user");
    const admin = makeUser("admin_stats_admin");

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

    await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Stats comment",
      });

    await request(app)
      .post("/api/likes")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
      });

    const statsRes = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);

    expect(statsRes.body.usersCount).toBeGreaterThanOrEqual(2);
    expect(statsRes.body.publicCocktailsCount).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.catalogCocktailsCount).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.userCocktailsCount).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.commentsCount).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.cocktailLikesCount).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.commentLikesCount).toBeGreaterThanOrEqual(0);
    expect(statsRes.body.reportsCount).toBeGreaterThanOrEqual(0);
    expect(statsRes.body.openReportsCount).toBeGreaterThanOrEqual(0);
  });

  test("non-admin cannot get system stats", async () => {
    const user = makeUser("admin_stats_forbidden");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("admin can delete any comment", async () => {
    const user = makeUser("admin_delete_comment_user");
    const admin = makeUser("admin_delete_comment_admin");

    const userToken = await registerAndLogin(user);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment to be removed by admin",
      });

    expect(commentRes.status).toBe(201);
    const commentId = commentRes.body.commentId;

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const deleteRes = await request(app)
      .delete(`/api/admin/comments/${commentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Comment deleted by admin");

    const commentsRes = await request(app).get("/api/comments/catalog/mojito");
    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.length).toBe(0);
  });

  test("non-admin cannot delete another user's comment through admin route", async () => {
    const user = makeUser("admin_delete_comment_forbidden");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .delete("/api/admin/comments/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("admin can deactivate user", async () => {
    const user = makeUser("deactivate_user_target");
    const admin = makeUser("deactivate_user_admin");

    await register(user);
    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const usersRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(usersRes.status).toBe(200);

    const targetUser = usersRes.body.find((u: any) => u.email === user.email);
    expect(targetUser).toBeTruthy();

    const deactivateRes = await request(app)
      .patch(`/api/admin/users/${targetUser.id}/deactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.message).toBe("User deactivated");

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect([401, 403]).toContain(loginRes.status);
  });

  test("admin cannot deactivate last active admin", async () => {
    const admin = makeUser("last_active_admin");

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const usersRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    const selfUser = usersRes.body.find((u: any) => u.email === admin.email);
    expect(selfUser).toBeTruthy();

    const deactivateRes = await request(app)
      .patch(`/api/admin/users/${selfUser.id}/deactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deactivateRes.status).toBe(409);
    expect(deactivateRes.body.message).toBe(
      "You cannot deactivate the last active admin",
    );
  });

  test("non-admin cannot deactivate users", async () => {
    const user = makeUser("deactivate_forbidden");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .patch("/api/admin/users/1/deactivate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("admin can reactivate user", async () => {
    const user = makeUser("reactivate_user_target");
    const admin = makeUser("reactivate_user_admin");

    await register(user);
    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const usersRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    const targetUser = usersRes.body.find((u: any) => u.email === user.email);

    await request(app)
      .patch(`/api/admin/users/${targetUser.id}/deactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    const reactivateRes = await request(app)
      .patch(`/api/admin/users/${targetUser.id}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.message).toBe("User reactivated");

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(200);
  });
});
