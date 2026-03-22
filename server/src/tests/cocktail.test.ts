import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  registerAndLogin,
  createOwnCocktail
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Cocktail tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("create, get my cocktails and update own cocktail work", async () => {
    const user = makeUser("owner");
    const token = await registerAndLogin(user);

    const cocktailId = await createOwnCocktail(token);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${token}`);

    expect(myRes.status).toBe(200);
    expect(Array.isArray(myRes.body)).toBe(true);
    expect(myRes.body.length).toBe(1);
    expect(myRes.body[0].id).toBe(cocktailId);
    expect(myRes.body[0].publication_status).toBe("draft");

    const updateRes = await request(app)
      .put(`/api/${cocktailId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Cocktail",
        category: "Alkoholowy",
        ingredients: "Updated ingredients",
        instructions: "Updated instructions",
        image: "https://example.com/new.jpg",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe("Cocktail updated");
  });

  test("editing someone else's cocktail returns 403", async () => {
    const owner = makeUser("owner2");
    const other = makeUser("other2");

    const ownerToken = await registerAndLogin(owner);
    const otherToken = await registerAndLogin(other);

    const cocktailId = await createOwnCocktail(ownerToken);

    const res = await request(app)
      .put(`/api/${cocktailId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({
        name: "Hack",
        category: "Alkoholowy",
        ingredients: "Hack",
        instructions: "Hack",
        image: null,
      });

    expect(res.status).toBe(403);
  });

  test("deleting someone else's cocktail returns 403", async () => {
    const owner = makeUser("owner3");
    const other = makeUser("other3");

    const ownerToken = await registerAndLogin(owner);
    const otherToken = await registerAndLogin(other);

    const cocktailId = await createOwnCocktail(ownerToken);

    const res = await request(app)
      .delete(`/api/${cocktailId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});