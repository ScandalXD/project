import request from "supertest";
import app from "../app";
import { db } from "../config/db";

jest.setTimeout(30000);

type AuthUser = {
  email: string;
  password: string;
  name: string;
  nickname: string;
};

const makeUser = (prefix: string): AuthUser => ({
  email: `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@test.com`,
  password: "123456",
  name: `${prefix} name`,
  nickname: `${prefix}_${Math.floor(Math.random() * 100000)}`,
});

async function resetDatabase() {
  await db.query("DELETE FROM favorites");
  await db.query("DELETE FROM public_cocktails");
  await db.query("DELETE FROM user_cocktails");
  await db.query("DELETE FROM users");
}

async function register(user: AuthUser) {
  return request(app).post("/api/auth/register").send(user);
}

async function login(user: Pick<AuthUser, "email" | "password">) {
  return request(app).post("/api/auth/login").send(user);
}

async function registerAndLogin(user: AuthUser) {
  const registerRes = await register(user);
  expect(registerRes.status).toBe(201);

  const loginRes = await login({
    email: user.email,
    password: user.password,
  });

  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toBeTruthy();

  return loginRes.body.token as string;
}

async function promoteToAdmin(email: string) {
  await db.query(`UPDATE users SET role = 'admin' WHERE email = ?`, [email]);
}

async function createOwnCocktail(token: string, overrides?: Partial<any>) {
  const payload = {
    name: "My Mojito",
    category: "Alkoholowy",
    ingredients: "Rum, mint, sugar, lime, soda",
    instructions: "Mix everything with ice",
    image: "https://example.com/mojito.jpg",
    ...overrides,
  };

  const res = await request(app)
    .post("/api")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);

  expect(res.status).toBe(201);
  expect(res.body.cocktailId).toBeTruthy();

  return res.body.cocktailId as number;
}

describe("CocktailApp integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await db.end();
  });

  test("register and login work", async () => {
    const user = makeUser("user1");

    const registerRes = await register(user);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeTruthy();
    expect(registerRes.body.user.email).toBe(user.email);
    expect(registerRes.body.user.nickname).toBe(user.nickname);
    expect(registerRes.body.user.role).toBe("user");

    const loginRes = await login({
      email: user.email,
      password: user.password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user.email).toBe(user.email);
  });

  test("registration with empty data returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "",
      password: "",
      name: "",
      nickname: "",
    });

    expect(res.status).toBe(400);
  });

  test("login with wrong password returns 401", async () => {
    const user = makeUser("wrongpass");

    await register(user);

    const res = await login({
      email: user.email,
      password: "wrong_password",
    });

    expect(res.status).toBe(401);
  });

  test("protected route without token returns 401", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
  });

  test("profile get and update work", async () => {
    const user = makeUser("profile");
    const token = await registerAndLogin(user);

    const profileRes = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.email).toBe(user.email);
    expect(profileRes.body.nickname).toBe(user.nickname);

    const updateRes = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
        nickname: "updated_nickname_1",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.token).toBeTruthy();
    expect(updateRes.body.user.name).toBe("Updated Name");
    expect(updateRes.body.user.nickname).toBe("updated_nickname_1");
  });

  test("catalog returns existing cocktails from database", async () => {
    const res = await request(app).get("/api/catalog");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
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

  test("editing чужого cocktail returns 403", async () => {
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

  test("deleting чужого cocktail returns 403", async () => {
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

  test("submit for moderation changes status to pending", async () => {
    const user = makeUser("moderation_user");
    const token = await registerAndLogin(user);

    const cocktailId = await createOwnCocktail(token);

    const submitRes = await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.message).toBe("Submitted for moderation");

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${token}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("pending");
  });

  test("repeated submit for moderation returns conflict status", async () => {
    const user = makeUser("repeat_publish");
    const token = await registerAndLogin(user);

    const cocktailId = await createOwnCocktail(token);

    const firstRes = await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(firstRes.status).toBe(200);

    const secondRes = await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect([400, 409]).toContain(secondRes.status);
  });

  test("admin can approve pending cocktail and it appears in public feed", async () => {
    const user = makeUser("pending_user");
    const admin = makeUser("admin_user");

    const userToken = await registerAndLogin(user);
    const cocktailId = await createOwnCocktail(userToken);

    const submitRes = await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(submitRes.status).toBe(200);

    await register(admin);
    await promoteToAdmin(admin.email);
    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });
    const adminToken = adminLogin.body.token as string;

    const pendingRes = await request(app)
      .get("/api/admin/moderation/pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.length).toBe(1);
    expect(pendingRes.body[0].id).toBe(cocktailId);

    const approveRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);

    const publicRes = await request(app).get("/api/public");
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.length).toBe(1);
    expect(publicRes.body[0].source_cocktail_id).toBe(cocktailId);
    expect(publicRes.body[0].author_nickname).toBe(user.nickname);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("approved");
  });

  test("admin can reject pending cocktail with reason", async () => {
    const user = makeUser("reject_user");
    const admin = makeUser("reject_admin");

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

    const rejectRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Please improve instructions",
      });

    expect(rejectRes.status).toBe(200);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("rejected");
    expect(myRes.body[0].moderation_reason).toBe("Please improve instructions");
  });

  test("admin can return pending cocktail to draft with reason", async () => {
    const user = makeUser("cancel_user");
    const admin = makeUser("cancel_admin");

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

    const cancelRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/cancel`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Fix ingredient formatting",
      });

    expect(cancelRes.status).toBe(200);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("draft");
    expect(myRes.body[0].moderation_reason).toBe("Fix ingredient formatting");
  });

  test("admin can remove published cocktail with reason", async () => {
    const user = makeUser("remove_user");
    const admin = makeUser("remove_admin");

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

    const removeRes = await request(app)
      .post(`/api/admin/moderation/${cocktailId}/remove`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Publication rules violation",
      });

    expect(removeRes.status).toBe(200);

    const publicRes = await request(app).get("/api/public");
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.length).toBe(0);

    const myRes = await request(app)
      .get("/api/my")
      .set("Authorization", `Bearer ${userToken}`);

    expect(myRes.status).toBe(200);
    expect(myRes.body[0].publication_status).toBe("rejected");
    expect(myRes.body[0].moderation_reason).toBe("Publication rules violation");
  });

  test("non-admin cannot access admin moderation routes", async () => {
    const user = makeUser("not_admin");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .get("/api/admin/moderation/pending")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
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

  test("user can delete own account", async () => {
  const user = makeUser("delete_self_user");
  const token = await registerAndLogin(user);

  const deleteRes = await request(app)
    .delete("/api/profile")
    .set("Authorization", `Bearer ${token}`);

  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.message).toBe("Account deleted");

  const loginRes = await login({
    email: user.email,
    password: user.password,
  });

  expect(loginRes.status).toBe(401);
});

test("admin can delete own account if not the last admin", async () => {
  const admin1 = makeUser("admin_delete_1");
  const admin2 = makeUser("admin_delete_2");

  await register(admin1);
  await register(admin2);

  await promoteToAdmin(admin1.email);
  await promoteToAdmin(admin2.email);

  const admin1Login = await login({
    email: admin1.email,
    password: admin1.password,
  });

  const admin1Token = admin1Login.body.token as string;

  const deleteRes = await request(app)
    .delete("/api/profile")
    .set("Authorization", `Bearer ${admin1Token}`);

  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.message).toBe("Account deleted");

  const loginRes = await login({
    email: admin1.email,
    password: admin1.password,
  });

  expect(loginRes.status).toBe(401);
});

test("last admin cannot delete own account", async () => {
  const admin = makeUser("last_admin");

  await register(admin);
  await promoteToAdmin(admin.email);

  const adminLogin = await login({
    email: admin.email,
    password: admin.password,
  });

  const adminToken = adminLogin.body.token as string;

  const deleteRes = await request(app)
    .delete("/api/profile")
    .set("Authorization", `Bearer ${adminToken}`);

  expect(deleteRes.status).toBe(409);
  expect(deleteRes.body.message).toBe("You cannot delete the last admin account");
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