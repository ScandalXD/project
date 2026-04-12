import { db } from "../config/db";
import { RowDataPacket } from "mysql2";

export const getAllUsers = async () => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, name, nickname, email, role, created_at
     FROM users
     ORDER BY created_at DESC, id DESC`
  );

  return rows;
};

export const getSystemStats = async () => {
  const [usersRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM users"
  );

  const [publicCocktailsRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM public_cocktails"
  );

  const [catalogCocktailsRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM catalog_cocktails"
  );

  const [userCocktailsRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM user_cocktails"
  );

  const [commentsRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM cocktail_comments"
  );

  const [cocktailLikesRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM cocktail_likes"
  );

  const [commentLikesRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM comment_likes"
  );

  const [reportsRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM reports"
  );

  const [openReportsRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM reports WHERE status = 'open'"
  );

  return {
    usersCount: Number(usersRows[0].count),
    publicCocktailsCount: Number(publicCocktailsRows[0].count),
    catalogCocktailsCount: Number(catalogCocktailsRows[0].count),
    userCocktailsCount: Number(userCocktailsRows[0].count),
    commentsCount: Number(commentsRows[0].count),
    cocktailLikesCount: Number(cocktailLikesRows[0].count),
    commentLikesCount: Number(commentLikesRows[0].count),
    reportsCount: Number(reportsRows[0].count),
    openReportsCount: Number(openReportsRows[0].count),
  };
};