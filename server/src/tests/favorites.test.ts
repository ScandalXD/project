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

describe("Favorites tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("favorites flow works for catalog cocktail", async () => {
    const user = makeUser("fav_catalog");
    const token = await registerAndLogin(user);

    const addRes = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cocktailId: "mojito",
        cocktail_type: "catalog",
      });

    expect([200, 201]).toContain(addRes.status);

    const listRes = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);

    const deleteRes = await request(app)
      .delete("/api/favorites/mojito/catalog")
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });

  test("favorites flow works for approved public cocktail", async () => {
    const user = makeUser("fav_public_user");
    const admin = makeUser("fav_public_admin");

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
    const publicId = publicRes.body[0].id;

    const addRes = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        cocktailId: String(publicId),
        cocktail_type: "public",
      });

    expect([200, 201]).toContain(addRes.status);

    const listRes = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${userToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);

    const deleteRes = await request(app)
      .delete(`/api/favorites/${publicId}/public`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(200);
  });
});