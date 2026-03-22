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

describe("Comments tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("user can comment on catalog cocktail and read comments", async () => {
    const user = makeUser("comment_catalog_user");
    const token = await registerAndLogin(user);

    const addRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Great cocktail from catalog",
      });

    expect(addRes.status).toBe(201);
    expect(addRes.body.commentId).toBeTruthy();

    const listRes = await request(app).get("/api/comments/catalog/mojito");

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].content).toBe("Great cocktail from catalog");
    expect(listRes.body[0].author_nickname).toBe(user.nickname);
  });

  test("user can delete own comment from catalog cocktail", async () => {
    const user = makeUser("delete_catalog_comment_user");
    const token = await registerAndLogin(user);

    const addRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment to remove",
      });

    expect(addRes.status).toBe(201);
    const commentId = addRes.body.commentId;

    const deleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get("/api/comments/catalog/mojito");
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(0);
  });

  test("user cannot delete someone else's comment", async () => {
    const user1 = makeUser("comment_owner");
    const user2 = makeUser("comment_other");

    const token1 = await registerAndLogin(user1);
    const token2 = await registerAndLogin(user2);

    const addRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "My protected comment",
      });

    expect(addRes.status).toBe(201);
    const commentId = addRes.body.commentId;

    const deleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(deleteRes.status).toBe(403);
  });

  test("unauthorized user cannot add comment", async () => {
    const res = await request(app).post("/api/comments").send({
      cocktailId: "mojito",
      cocktailType: "catalog",
      content: "Unauthorized comment",
    });

    expect(res.status).toBe(401);
  });

  test("user can comment on approved public cocktail", async () => {
    const user = makeUser("comment_public_user");
    const admin = makeUser("comment_public_admin");

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

    const publicRes = await request(app).get("/api/public");
    expect(publicRes.status).toBe(200);

    const publicId = String(publicRes.body[0].id);

    const addCommentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        cocktailId: publicId,
        cocktailType: "public",
        content: "Nice public cocktail",
      });

    expect(addCommentRes.status).toBe(201);
    expect(addCommentRes.body.commentId).toBeTruthy();

    const commentsRes = await request(app).get(
      `/api/comments/public/${publicId}`,
    );

    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.length).toBe(1);
    expect(commentsRes.body[0].content).toBe("Nice public cocktail");
    expect(commentsRes.body[0].author_nickname).toBe(user.nickname);
  });

  test("cannot comment on non-existing cocktail", async () => {
    const user = makeUser("comment_missing");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "not-existing-id",
        cocktailType: "catalog",
        content: "Hello",
      });

    expect(res.status).toBe(404);
  });

  test("user can reply to catalog comment", async () => {
    const user = makeUser("reply_catalog_user");
    const token = await registerAndLogin(user);

    const parentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Parent comment",
      });

    expect(parentRes.status).toBe(201);
    const parentCommentId = parentRes.body.commentId;

    const replyRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Reply to parent",
        parentCommentId,
      });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.commentId).toBeTruthy();

    const commentsRes = await request(app)
      .get("/api/comments/catalog/mojito")
      .set("Authorization", `Bearer ${token}`);

    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.length).toBe(1);
    expect(commentsRes.body[0].content).toBe("Parent comment");
    expect(Array.isArray(commentsRes.body[0].replies)).toBe(true);
    expect(commentsRes.body[0].replies.length).toBe(1);
    expect(commentsRes.body[0].replies[0].content).toBe("Reply to parent");
    expect(commentsRes.body[0].replies[0].parent_comment_id).toBe(
      parentCommentId,
    );
  });

  test("user can reply to reply and get nested comment tree", async () => {
    const user = makeUser("nested_reply_user");
    const token = await registerAndLogin(user);

    const parentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Level 1",
      });

    expect(parentRes.status).toBe(201);
    const level1Id = parentRes.body.commentId;

    const reply1Res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Level 2",
        parentCommentId: level1Id,
      });

    expect(reply1Res.status).toBe(201);
    const level2Id = reply1Res.body.commentId;

    const reply2Res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Level 3",
        parentCommentId: level2Id,
      });

    expect(reply2Res.status).toBe(201);

    const commentsRes = await request(app)
      .get("/api/comments/catalog/mojito")
      .set("Authorization", `Bearer ${token}`);

    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.length).toBe(1);
    expect(commentsRes.body[0].content).toBe("Level 1");
    expect(commentsRes.body[0].replies.length).toBe(1);
    expect(commentsRes.body[0].replies[0].content).toBe("Level 2");
    expect(commentsRes.body[0].replies[0].replies.length).toBe(1);
    expect(commentsRes.body[0].replies[0].replies[0].content).toBe("Level 3");
  });

  test("cannot reply to comment from another cocktail", async () => {
    const user = makeUser("wrong_parent_user");
    const token = await registerAndLogin(user);

    const ownCocktailId = await createOwnCocktail(token);

    await request(app)
      .post(`/api/${ownCocktailId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    const admin = makeUser("wrong_parent_admin");
    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    await request(app)
      .post(`/api/admin/moderation/${ownCocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    const publicRes = await request(app).get("/api/public");
    expect(publicRes.status).toBe(200);
    const publicId = String(publicRes.body[0].id);

    const parentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: publicId,
        cocktailType: "public",
        content: "Parent on public cocktail",
      });

    expect(parentRes.status).toBe(201);
    const parentCommentId = parentRes.body.commentId;

    const badReplyRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Wrong place reply",
        parentCommentId,
      });

    expect(badReplyRes.status).toBe(409);
  });
});