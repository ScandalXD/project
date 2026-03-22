import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Comment likes tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("user can like and unlike own comment", async () => {
    const user = makeUser("like_own_comment_user");
    const token = await registerAndLogin(user);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "My own comment",
      });

    expect(commentRes.status).toBe(201);
    const commentId = commentRes.body.commentId;

    const addLikeRes = await request(app)
      .post("/api/comment-likes")
      .set("Authorization", `Bearer ${token}`)
      .send({ commentId });

    expect(addLikeRes.status).toBe(201);

    const countRes = await request(app).get(`/api/comment-likes/${commentId}`);
    expect(countRes.status).toBe(200);
    expect(countRes.body.count).toBe(1);

    const meRes = await request(app)
      .get(`/api/comment-likes/${commentId}/me`)
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.liked).toBe(true);

    const removeLikeRes = await request(app)
      .delete(`/api/comment-likes/${commentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(removeLikeRes.status).toBe(200);

    const countAfterRes = await request(app).get(
      `/api/comment-likes/${commentId}`,
    );
    expect(countAfterRes.status).toBe(200);
    expect(countAfterRes.body.count).toBe(0);
  });

  test("user can like чужой comment", async () => {
    const user1 = makeUser("comment_like_owner");
    const user2 = makeUser("comment_like_other");

    const token1 = await registerAndLogin(user1);
    const token2 = await registerAndLogin(user2);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment by user1",
      });

    expect(commentRes.status).toBe(201);
    const commentId = commentRes.body.commentId;

    const addLikeRes = await request(app)
      .post("/api/comment-likes")
      .set("Authorization", `Bearer ${token2}`)
      .send({ commentId });

    expect(addLikeRes.status).toBe(201);

    const countRes = await request(app).get(`/api/comment-likes/${commentId}`);
    expect(countRes.status).toBe(200);
    expect(countRes.body.count).toBe(1);
  });

  test("user cannot like same comment twice", async () => {
    const user = makeUser("duplicate_comment_like_user");
    const token = await registerAndLogin(user);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment to like twice",
      });

    expect(commentRes.status).toBe(201);
    const commentId = commentRes.body.commentId;

    const firstRes = await request(app)
      .post("/api/comment-likes")
      .set("Authorization", `Bearer ${token}`)
      .send({ commentId });

    expect(firstRes.status).toBe(201);

    const secondRes = await request(app)
      .post("/api/comment-likes")
      .set("Authorization", `Bearer ${token}`)
      .send({ commentId });

    expect(secondRes.status).toBe(409);
  });

  test("unauthorized user cannot like comment", async () => {
    const user = makeUser("unauth_comment_like_owner");
    const token = await registerAndLogin(user);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment for unauthorized like test",
      });

    expect(commentRes.status).toBe(201);
    const commentId = commentRes.body.commentId;

    const res = await request(app)
      .post("/api/comment-likes")
      .send({ commentId });

    expect(res.status).toBe(401);
  });

  test("comment tree includes like metadata for authorized user", async () => {
    const user1 = makeUser("comment_meta_owner");
    const user2 = makeUser("comment_meta_liker");

    const token1 = await registerAndLogin(user1);
    const token2 = await registerAndLogin(user2);

    const parentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Parent for metadata",
      });

    expect(parentRes.status).toBe(201);
    const parentId = parentRes.body.commentId;

    const replyRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Reply for metadata",
        parentCommentId: parentId,
      });

    expect(replyRes.status).toBe(201);
    const replyId = replyRes.body.commentId;

    await request(app)
      .post("/api/comment-likes")
      .set("Authorization", `Bearer ${token2}`)
      .send({ commentId: parentId });

    await request(app)
      .post("/api/comment-likes")
      .set("Authorization", `Bearer ${token2}`)
      .send({ commentId: replyId });

    const commentsRes = await request(app)
      .get("/api/comments/catalog/mojito")
      .set("Authorization", `Bearer ${token2}`);

    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body[0].likes_count).toBe(1);
    expect(commentsRes.body[0].is_liked_by_user).toBe(true);
    expect(commentsRes.body[0].replies[0].likes_count).toBe(1);
    expect(commentsRes.body[0].replies[0].is_liked_by_user).toBe(true);
  });
});