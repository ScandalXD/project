import request from "supertest";
import app from "../app";
import { db } from "../config/db";

import {
  makeUser,
  resetDatabase,
  promoteToAdmin,
  register,
  login
} from "../utils/testHelpers";

jest.setTimeout(30000);

describe("Catalog admin tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  // ✅ ВОТ ТВОЙ 45 ТЕСТ
  test("catalog returns existing cocktails from database", async () => {
    const res = await request(app).get("/api/catalog");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("admin can add catalog cocktail", async () => {
    const admin = makeUser("catalog_admin_create");

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    const newCatalogId = `test-negroni-${Date.now()}`;

    const createRes = await request(app)
      .post("/api/admin/catalog")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id: newCatalogId,
        name: "Negroni",
        category: "Alkoholowy",
        ingredients: "Gin, Campari, Sweet Vermouth",
        instructions: "Stir with ice and strain into a glass",
        image: "assets/cocktails/alcoholic/negroni.jpg",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toBe("Catalog cocktail created");

    const catalogRes = await request(app).get("/api/catalog");

    expect(catalogRes.status).toBe(200);
    expect(Array.isArray(catalogRes.body)).toBe(true);

    const created = catalogRes.body.find((c: any) => c.id === newCatalogId);
    expect(created).toBeTruthy();
    expect(created.name).toBe("Negroni");
  });

  test("admin can update catalog cocktail", async () => {
    const admin = makeUser("catalog_admin_update");

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;
    const newCatalogId = `test-update-${Date.now()}`;

    await request(app)
      .post("/api/admin/catalog")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id: newCatalogId,
        name: "Test Cocktail",
        category: "Alkoholowy",
        ingredients: "A, B, C",
        instructions: "Mix",
        image: "assets/cocktails/alcoholic/test.jpg",
      });

    const updateRes = await request(app)
      .put(`/api/admin/catalog/${newCatalogId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Cocktail Updated",
        category: "Alkoholowy",
        ingredients: "A, B, C, D",
        instructions: "Shake and serve",
        image: "assets/cocktails/alcoholic/test-updated.jpg",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe("Catalog cocktail updated");

    const catalogRes = await request(app).get("/api/catalog");
    const updated = catalogRes.body.find((c: any) => c.id === newCatalogId);

    expect(updated).toBeTruthy();
    expect(updated.name).toBe("Test Cocktail Updated");
    expect(updated.ingredients).toBe("A, B, C, D");
  });

  test("admin can delete catalog cocktail", async () => {
    const admin = makeUser("catalog_admin_delete");

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;
    const newCatalogId = `test-delete-${Date.now()}`;

    await request(app)
      .post("/api/admin/catalog")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id: newCatalogId,
        name: "Delete Me",
        category: "Alkoholowy",
        ingredients: "X, Y, Z",
        instructions: "Delete later",
        image: "assets/cocktails/alcoholic/delete.jpg",
      });

    const deleteRes = await request(app)
      .delete(`/api/admin/catalog/${newCatalogId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Catalog cocktail deleted");

    const catalogRes = await request(app).get("/api/catalog");
    const deleted = catalogRes.body.find((c: any) => c.id === newCatalogId);

    expect(deleted).toBeUndefined();
  });

  test("admin cannot create duplicate catalog cocktail id", async () => {
    const admin = makeUser("catalog_duplicate_admin");

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;
    const duplicateId = `duplicate-${Date.now()}`;

    const firstRes = await request(app)
      .post("/api/admin/catalog")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id: duplicateId,
        name: "First",
        category: "Alkoholowy",
        ingredients: "A",
        instructions: "Mix",
        image: "assets/cocktails/alcoholic/first.jpg",
      });

    expect(firstRes.status).toBe(201);

    const secondRes = await request(app)
      .post("/api/admin/catalog")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id: duplicateId,
        name: "Second",
        category: "Alkoholowy",
        ingredients: "B",
        instructions: "Mix again",
        image: "assets/cocktails/alcoholic/second.jpg",
      });

    expect(secondRes.status).toBe(409);
  });
});