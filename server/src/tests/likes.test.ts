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

describe("Likes tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("user can like and unlike catalog cocktail", async () => {
    const user = makeUser("like_catalog_user");
    const token = await registerAndLogin(user);

    const addRes = await request(app)
      .post("/api/likes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
      });

    expect(addRes.status).toBe(201);

    const countRes = await request(app).get("/api/likes/catalog/mojito");
    expect(countRes.status).toBe(200);
    expect(countRes.body.count).toBe(1);

    const meRes = await request(app)
      .get("/api/likes/catalog/mojito/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.liked).toBe(true);

    const removeRes = await request(app)
      .delete("/api/likes/catalog/mojito")
      .set("Authorization", `Bearer ${token}`);

    expect(removeRes.status).toBe(200);

    const countAfterRes = await request(app).get("/api/likes/catalog/mojito");
    expect(countAfterRes.status).toBe(200);
    expect(countAfterRes.body.count).toBe(0);
  });

  test("user cannot like same catalog cocktail twice", async () => {
    const user = makeUser("like_catalog_duplicate");
    const token = await registerAndLogin(user);

    const firstRes = await request(app)
      .post("/api/likes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
      });

    expect(firstRes.status).toBe(201);

    const secondRes = await request(app)
      .post("/api/likes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
      });

    expect(secondRes.status).toBe(409);
  });

  test("unauthorized user cannot like cocktail", async () => {
    const res = await request(app).post("/api/likes").send({
      cocktailId: "mojito",
      cocktailType: "catalog",
    });

    expect(res.status).toBe(401);
  });

  test("user can like approved public cocktail", async () => {
    const user = makeUser("like_public_user");
    const admin = makeUser("like_public_admin");

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

    const addLikeRes = await request(app)
      .post("/api/likes")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        cocktailId: publicId,
        cocktailType: "public",
      });

    expect(addLikeRes.status).toBe(201);

    const countRes = await request(app).get(`/api/likes/public/${publicId}`);
    expect(countRes.status).toBe(200);
    expect(countRes.body.count).toBe(1);
  });

  test("cannot like non-existing cocktail", async () => {
    const user = makeUser("like_missing");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .post("/api/likes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "not-existing-id",
        cocktailType: "catalog",
      });

    expect(res.status).toBe(404);
  });
});