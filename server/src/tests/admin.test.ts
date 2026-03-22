import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin
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
});