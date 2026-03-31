import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin,
  register,
  login,
  createOwnCocktail,
  promoteToAdmin
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Notifications / Mentions tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("mention creates notification for tagged user", async () => {
    const author = makeUser("mention_author");
    const tagged = makeUser("mention_tagged");

    const authorToken = await registerAndLogin(author);
    await register(tagged);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: `Hello @${tagged.nickname}`,
      });

    expect(commentRes.status).toBe(201);

    const taggedLogin = await login({
      email: tagged.email,
      password: tagged.password,
    });

    const taggedToken = taggedLogin.body.token as string;

    const notificationsRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${taggedToken}`);

    expect(notificationsRes.status).toBe(200);
    expect(Array.isArray(notificationsRes.body)).toBe(true);
    expect(notificationsRes.body.length).toBe(1);
    expect(notificationsRes.body[0].type).toBe("mention");
    expect(notificationsRes.body[0].actor_nickname).toBe(author.nickname);
    expect(notificationsRes.body[0].recipe_id).toBe("mojito");
    expect(notificationsRes.body[0].recipe_type).toBe("catalog");
    expect(notificationsRes.body[0].comment_content).toContain(`@${tagged.nickname}`);
    expect(notificationsRes.body[0].is_read).toBe(0);
  });

  test("self mention does not create notification", async () => {
    const user = makeUser("self_mention");
    const token = await registerAndLogin(user);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: `Hi @${user.nickname}`,
      });

    expect(commentRes.status).toBe(201);

    const notificationsRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(notificationsRes.status).toBe(200);
    expect(Array.isArray(notificationsRes.body)).toBe(true);
    expect(notificationsRes.body.length).toBe(0);
  });

  test("duplicate mention in one comment creates only one notification", async () => {
    const author = makeUser("dup_mention_author");
    const tagged = makeUser("dup_mention_tagged");

    const authorToken = await registerAndLogin(author);
    await register(tagged);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: `@${tagged.nickname} hello again @${tagged.nickname}`,
      });

    expect(commentRes.status).toBe(201);

    const taggedLogin = await login({
      email: tagged.email,
      password: tagged.password,
    });
    const taggedToken = taggedLogin.body.token as string;

    const notificationsRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${taggedToken}`);

    expect(notificationsRes.status).toBe(200);
    expect(notificationsRes.body.length).toBe(1);
  });

  test("can mark one notification as read", async () => {
    const author = makeUser("read_one_author");
    const tagged = makeUser("read_one_tagged");

    const authorToken = await registerAndLogin(author);
    await register(tagged);

    await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: `Hello @${tagged.nickname}`,
      });

    const taggedLogin = await login({
      email: tagged.email,
      password: tagged.password,
    });
    const taggedToken = taggedLogin.body.token as string;

    const notificationsRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${taggedToken}`);

    const notificationId = notificationsRes.body[0].id;

    const markRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${taggedToken}`);

    expect(markRes.status).toBe(200);
    expect(markRes.body.message).toBe("Notification marked as read");

    const after = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${taggedToken}`);

    expect(after.body[0].is_read).toBe(1);
  });

  test("can mark all notifications as read", async () => {
    const author = makeUser("read_all_author");
    const tagged = makeUser("read_all_tagged");

    const authorToken = await registerAndLogin(author);
    await register(tagged);

    await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: `First @${tagged.nickname}`,
      });

    await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: `Second @${tagged.nickname}`,
      });

    const taggedLogin = await login({
      email: tagged.email,
      password: tagged.password,
    });
    const taggedToken = taggedLogin.body.token as string;

    const markAllRes = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${taggedToken}`);

    expect(markAllRes.status).toBe(200);
    expect(markAllRes.body.message).toBe("All notifications marked as read");

    const after = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${taggedToken}`);

    expect(after.body[0].is_read).toBe(1);
    expect(after.body[1].is_read).toBe(1);
  });

  test("unauthorized user cannot get notifications", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  test("unauthorized user cannot mark notification as read", async () => {
    const res = await request(app).patch("/api/notifications/1/read");
    expect(res.status).toBe(401);
  });

  test("public cocktail like creates notification for author", async () => {
  const author = makeUser("notif_like_author");
  const liker = makeUser("notif_like_liker");
  const authorToken = await registerAndLogin(author);
  const cocktailId = await createOwnCocktail(authorToken);

  await request(app)
    .post(`/api/${cocktailId}/publish`)
    .set("Authorization", `Bearer ${authorToken}`);

  const admin = makeUser("notif_like_admin");
  await register(admin);
  await promoteToAdmin(admin.email);

  const adminLogin = await login({
    email: admin.email,
    password: admin.password,
  });

  await request(app)
    .post(`/api/admin/moderation/${cocktailId}/approve`)
    .set("Authorization", `Bearer ${adminLogin.body.token}`);

  const likerToken = await registerAndLogin(liker);

  const publicRes = await request(app).get("/api/public");
  const publicId = String(publicRes.body[0].id);

  const likeRes = await request(app)
    .post("/api/likes")
    .set("Authorization", `Bearer ${likerToken}`)
    .send({
      cocktailId: publicId,
      cocktailType: "public",
    });

  expect(likeRes.status).toBe(201);

  const notificationsRes = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${authorToken}`);

  expect(notificationsRes.status).toBe(200);
  expect(notificationsRes.body[0].type).toBe("cocktail_like");
  expect(notificationsRes.body[0].recipe_type).toBe("public");
  expect(notificationsRes.body[0].recipe_id).toBe(publicId);
});

test("comment on public cocktail creates notification for author", async () => {
  const author = makeUser("notif_comment_author");
  const commenter = makeUser("notif_comment_commenter");
  const authorToken = await registerAndLogin(author);
  const cocktailId = await createOwnCocktail(authorToken);

  await request(app)
    .post(`/api/${cocktailId}/publish`)
    .set("Authorization", `Bearer ${authorToken}`);

  const admin = makeUser("notif_comment_admin");
  await register(admin);
  await promoteToAdmin(admin.email);

  const adminLogin = await login({
    email: admin.email,
    password: admin.password,
  });

  await request(app)
    .post(`/api/admin/moderation/${cocktailId}/approve`)
    .set("Authorization", `Bearer ${adminLogin.body.token}`);

  const commenterToken = await registerAndLogin(commenter);

  const publicRes = await request(app).get("/api/public");
  const publicId = String(publicRes.body[0].id);

  const commentRes = await request(app)
    .post("/api/comments")
    .set("Authorization", `Bearer ${commenterToken}`)
    .send({
      cocktailId: publicId,
      cocktailType: "public",
      content: "Nice recipe",
    });

  expect(commentRes.status).toBe(201);

  const notificationsRes = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${authorToken}`);

  expect(notificationsRes.status).toBe(200);
  expect(notificationsRes.body[0].type).toBe("cocktail_comment");
  expect(notificationsRes.body[0].recipe_type).toBe("public");
  expect(notificationsRes.body[0].recipe_id).toBe(publicId);
  expect(notificationsRes.body[0].comment_id).toBe(commentRes.body.commentId);
});

test("reply creates notification for parent comment author", async () => {
  const user1 = makeUser("notif_reply_user1");
  const user2 = makeUser("notif_reply_user2");

  const token1 = await registerAndLogin(user1);
  const token2 = await registerAndLogin(user2);

  const parentRes = await request(app)
    .post("/api/comments")
    .set("Authorization", `Bearer ${token1}`)
    .send({
      cocktailId: "mojito",
      cocktailType: "catalog",
      content: "Parent comment",
    });

  expect(parentRes.status).toBe(201);

  const replyRes = await request(app)
    .post("/api/comments")
    .set("Authorization", `Bearer ${token2}`)
    .send({
      cocktailId: "mojito",
      cocktailType: "catalog",
      content: "Reply here",
      parentCommentId: parentRes.body.commentId,
    });

  expect(replyRes.status).toBe(201);

  const notificationsRes = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${token1}`);

  expect(notificationsRes.status).toBe(200);
  expect(notificationsRes.body[0].type).toBe("comment_reply");
  expect(notificationsRes.body[0].comment_id).toBe(replyRes.body.commentId);
});

test("comment like creates notification for comment author", async () => {
  const author = makeUser("notif_comment_like_author");
  const liker = makeUser("notif_comment_like_liker");

  const authorToken = await registerAndLogin(author);
  const likerToken = await registerAndLogin(liker);

  const commentRes = await request(app)
    .post("/api/comments")
    .set("Authorization", `Bearer ${authorToken}`)
    .send({
      cocktailId: "mojito",
      cocktailType: "catalog",
      content: "Comment to like",
    });

  expect(commentRes.status).toBe(201);

  const likeRes = await request(app)
    .post("/api/comment-likes")
    .set("Authorization", `Bearer ${likerToken}`)
    .send({
      commentId: commentRes.body.commentId,
    });

  expect(likeRes.status).toBe(201);

  const notificationsRes = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${authorToken}`);

  expect(notificationsRes.status).toBe(200);
  expect(notificationsRes.body[0].type).toBe("comment_like");
  expect(notificationsRes.body[0].comment_id).toBe(commentRes.body.commentId);
});

test("notifications are sorted newest first", async () => {
  const author = makeUser("notif_sort_author");
  const user1 = makeUser("notif_sort_user1");
  const user2 = makeUser("notif_sort_user2");

  const authorToken = await registerAndLogin(author);
  const token1 = await registerAndLogin(user1);
  const token2 = await registerAndLogin(user2);

  await request(app)
    .post("/api/comments")
    .set("Authorization", `Bearer ${token1}`)
    .send({
      cocktailId: "mojito",
      cocktailType: "catalog",
      content: `Hello @${author.nickname}`,
    });

  await request(app)
    .post("/api/comments")
    .set("Authorization", `Bearer ${token2}`)
    .send({
      cocktailId: "mojito",
      cocktailType: "catalog",
      content: `Hello again @${author.nickname}`,
    });

  const notificationsRes = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${authorToken}`);

  expect(notificationsRes.status).toBe(200);
  expect(notificationsRes.body.length).toBe(2);
  expect(notificationsRes.body[0].actor_nickname).toBe(user2.nickname);
  expect(notificationsRes.body[1].actor_nickname).toBe(user1.nickname);
});


});