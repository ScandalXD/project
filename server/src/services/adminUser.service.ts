import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ServiceError } from "./cocktail.service";

export const deactivateUser = async (userId: number): Promise<void> => {
  if (!Number.isInteger(userId)) {
    throw new ServiceError("Invalid user id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, role, is_active FROM users WHERE id = ?",
    [userId]
  );

  if (rows.length === 0) {
    throw new ServiceError("User not found", 404);
  }

  const user = rows[0] as {
    id: number;
    role: "user" | "admin";
    is_active: number | boolean;
  };

  if (!user.is_active) {
    throw new ServiceError("User is already deactivated", 409);
  }

  if (user.role === "admin") {
    const [adminRows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = TRUE"
    );

    const activeAdminsCount = Number(adminRows[0].count);

    if (activeAdminsCount === 1) {
      throw new ServiceError("You cannot deactivate the last active admin", 409);
    }
  }

  await db.query<ResultSetHeader>(
    "UPDATE users SET is_active = FALSE WHERE id = ?",
    [userId]
  );
};

export const reactivateUser = async (userId: number): Promise<void> => {
  if (!Number.isInteger(userId)) {
    throw new ServiceError("Invalid user id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, is_active FROM users WHERE id = ?",
    [userId]
  );

  if (rows.length === 0) {
    throw new ServiceError("User not found", 404);
  }

  const user = rows[0] as {
    id: number;
    is_active: number | boolean;
  };

  if (user.is_active) {
    throw new ServiceError("User is already active", 409);
  }

  await db.query<ResultSetHeader>(
    "UPDATE users SET is_active = TRUE WHERE id = ?",
    [userId]
  );
};