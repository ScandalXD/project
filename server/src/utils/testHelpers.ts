import request from "supertest";
import app from "../app";
import { db } from "../config/db";

export type AuthUser = {
  email: string;
  password: string;
  name: string;
  nickname: string;
};

export const makeUser = (prefix: string): AuthUser => ({
  email: `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@test.com`,
  password: "123456",
  name: `${prefix} name`,
  nickname: `${prefix}_${Math.floor(Math.random() * 100000)}`,
});

export async function resetDatabase() {
  await db.query("DELETE FROM notifications");
  await db.query("DELETE FROM comment_mentions");
  await db.query("DELETE FROM comment_likes");
  await db.query("DELETE FROM reports");
  await db.query("DELETE FROM cocktail_comments");
  await db.query("DELETE FROM cocktail_likes");
  await db.query("DELETE FROM favorites");
  await db.query("DELETE FROM public_cocktails");
  await db.query("DELETE FROM user_cocktails");
  await db.query("DELETE FROM users");
}

export async function register(user: AuthUser) {
  return request(app).post("/api/auth/register").send(user);
}

export async function login(user: Pick<AuthUser, "email" | "password">) {
  return request(app).post("/api/auth/login").send(user);
}

export async function registerAndLogin(user: AuthUser) {
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

export async function promoteToAdmin(email: string) {
  await db.query(`UPDATE users SET role = 'admin' WHERE email = ?`, [email]);
}

export async function createOwnCocktail(
  token: string,
  overrides?: Partial<any>,
) {
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
