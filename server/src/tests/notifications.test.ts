import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin,
  register,
  login
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
});