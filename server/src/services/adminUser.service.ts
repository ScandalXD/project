import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ServiceError } from "./cocktail.service";

type UserRole = "user" | "admin" | "superadmin";

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
    role: UserRole;
    is_active: number | boolean;
  };

  if (!user.is_active) {
    throw new ServiceError("User is already deactivated", 409);
  }

  if (user.role === "superadmin") {
    const [superadminRows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin' AND is_active = TRUE"
    );

    const activeSuperadminsCount = Number(superadminRows[0].count);

    if (activeSuperadminsCount === 1) {
      throw new ServiceError(
        "You cannot deactivate the last active superadmin",
        409
      );
    }
  }

  if (user.role === "admin") {
    const [adminRows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM users WHERE role IN ('admin', 'superadmin') AND is_active = TRUE"
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

export const updateUserRole = async (
  userId: number,
  role: UserRole
): Promise<void> => {
  if (!Number.isInteger(userId)) {
    throw new ServiceError("Invalid user id", 400);
  }

  if (!["user", "admin", "superadmin"].includes(role)) {
    throw new ServiceError("Invalid role", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, role FROM users WHERE id = ?",
    [userId]
  );

  if (rows.length === 0) {
    throw new ServiceError("User not found", 404);
  }

  const currentUser = rows[0] as { id: number; role: UserRole };

  if (currentUser.role === "superadmin" && role !== "superadmin") {
    const [superadminRows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin' AND is_active = TRUE"
    );

    const activeSuperadminsCount = Number(superadminRows[0].count);

    if (activeSuperadminsCount === 1) {
      throw new ServiceError(
        "You cannot remove the last active superadmin",
        409
      );
    }
  }

  if (role === "superadmin") {
    throw new ServiceError("Superadmin role cannot be assigned from UI", 403)
  }

  await db.query<ResultSetHeader>("UPDATE users SET role = ? WHERE id = ?", [
    role,
    userId,
  ]);
};