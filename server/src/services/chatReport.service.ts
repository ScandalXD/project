import { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "../config/db";
import {
  ChatReport,
  ChatReportAction,
  ChatReportReason,
  ChatReportStatus,
  ChatReportTargetType,
} from "../models/ChatReport.model";
import { ServiceError } from "./cocktail.service";
import { createNotification } from "./notificationEvent.service";
import { deleteUploadedFile } from "../utils/file.util";

const validReasons: ChatReportReason[] = [
  "spam",
  "harassment",
  "abuse",
  "inappropriate_content",
  "scam",
  "fake_account",
  "other",
];

const validateReason = (reason: ChatReportReason) => {
  if (!validReasons.includes(reason)) {
    throw new ServiceError("Invalid report reason", 400);
  }
};

const ensureInteger = (value: number, message: string) => {
  if (!Number.isInteger(value)) {
    throw new ServiceError(message, 400);
  }
};

const getMessageForReport = async (reporterUserId: number, messageId: number) => {
  ensureInteger(messageId, "Invalid message id");

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT m.*, cp.user_id AS participant_user_id
     FROM messages m
     JOIN conversation_participants cp
       ON cp.conversation_id = m.conversation_id
      AND cp.user_id = ?
     WHERE m.id = ?`,
    [reporterUserId, messageId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Message not found", 404);
  }

  const message = rows[0] as {
    id: number;
    sender_id: number;
    metadata: string | null;
  };

  if (Number(message.sender_id) === Number(reporterUserId)) {
    throw new ServiceError("You cannot report your own message", 400);
  }

  return message;
};

const ensureUserExists = async (userId: number) => {
  ensureInteger(userId, "Invalid user id");

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE id = ? AND is_active = TRUE",
    [userId],
  );

  if (rows.length === 0) {
    throw new ServiceError("User not found", 404);
  }
};

export const createChatReport = async (
  reporterUserId: number,
  targetType: ChatReportTargetType,
  reason: ChatReportReason,
  details?: string | null,
  messageId?: number | null,
  targetUserId?: number | null,
): Promise<number> => {
  validateReason(reason);

  let resolvedTargetUserId: number;
  let resolvedMessageId: number | null = null;

  if (targetType === "message") {
    if (!messageId) {
      throw new ServiceError("Message id is required", 400);
    }

    const message = await getMessageForReport(reporterUserId, Number(messageId));
    resolvedMessageId = Number(message.id);
    resolvedTargetUserId = Number(message.sender_id);
  } else if (targetType === "user") {
    if (!targetUserId) {
      throw new ServiceError("Target user id is required", 400);
    }

    if (Number(targetUserId) === Number(reporterUserId)) {
      throw new ServiceError("You cannot report yourself", 400);
    }

    await ensureUserExists(Number(targetUserId));
    resolvedTargetUserId = Number(targetUserId);
  } else {
    throw new ServiceError("Invalid report target type", 400);
  }

  const [existing] = await db.query<RowDataPacket[]>(
    `SELECT id
     FROM chat_reports
     WHERE reporter_user_id = ?
       AND target_type = ?
       AND target_user_id = ?
       AND (message_id <=> ?)
       AND status = 'open'`,
    [reporterUserId, targetType, resolvedTargetUserId, resolvedMessageId],
  );

  if (existing.length > 0) {
    throw new ServiceError("You already have an open report for this target", 409);
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO chat_reports
      (reporter_user_id, target_type, target_user_id, message_id, reason, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      reporterUserId,
      targetType,
      resolvedTargetUserId,
      resolvedMessageId,
      reason,
      details?.trim() || null,
    ],
  );

  return result.insertId;
};

export const getAdminChatReports = async (
  status?: ChatReportStatus,
): Promise<ChatReport[]> => {
  const params: Array<string> = [];
  const statusFilter = status ? "WHERE cr.status = ?" : "";

  if (status) {
    params.push(status);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       cr.*,
       reporter.nickname AS reporter_nickname,
       target.nickname AS target_nickname,
       reviewer.nickname AS reviewed_by_nickname,
       m.content AS message_content,
       m.message_type,
       m.created_at AS message_created_at
     FROM chat_reports cr
     JOIN users reporter ON cr.reporter_user_id = reporter.id
     JOIN users target ON cr.target_user_id = target.id
     LEFT JOIN users reviewer ON cr.reviewed_by = reviewer.id
     LEFT JOIN messages m ON cr.message_id = m.id
     ${statusFilter}
     ORDER BY cr.created_at DESC, cr.id DESC`,
    params,
  );

  return rows as ChatReport[];
};

const getOpenChatReport = async (reportId: number): Promise<ChatReport> => {
  ensureInteger(reportId, "Invalid report id");

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM chat_reports WHERE id = ?",
    [reportId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Chat report not found", 404);
  }

  const report = rows[0] as ChatReport;

  if (report.status !== "open") {
    throw new ServiceError("Chat report is already reviewed", 409);
  }

  return report;
};

const finishReport = async (
  adminId: number,
  reportId: number,
  status: ChatReportStatus,
  actionTaken: ChatReportAction,
  adminReason: string,
) => {
  await db.query<ResultSetHeader>(
    `UPDATE chat_reports
     SET status = ?,
         reviewed_by = ?,
         reviewed_at = NOW(),
         admin_reason = ?,
         action_taken = ?
     WHERE id = ?`,
    [status, adminId, adminReason, actionTaken, reportId],
  );
};

export const dismissChatReport = async (
  adminId: number,
  reportId: number,
  adminReason: string,
): Promise<void> => {
  if (!adminReason?.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  await getOpenChatReport(reportId);
  await finishReport(adminId, reportId, "rejected", "dismiss", adminReason.trim());
};

const getAttachmentFilePath = (metadata: string | null): string | null => {
  if (!metadata) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadata) as { fileUrl?: string };
    return parsed.fileUrl?.startsWith("/uploads/chat/") ? parsed.fileUrl : null;
  } catch {
    return null;
  }
};

export const deleteReportedMessage = async (
  adminId: number,
  reportId: number,
  adminReason: string,
): Promise<void> => {
  if (!adminReason?.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  const report = await getOpenChatReport(reportId);

  if (!report.message_id) {
    throw new ServiceError("Report has no message", 409);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, sender_id, metadata FROM messages WHERE id = ?",
    [report.message_id],
  );

  if (rows.length === 0) {
    throw new ServiceError("Message not found", 404);
  }

  const message = rows[0] as {
    id: number;
    sender_id: number;
    metadata: string | null;
  };
  const filePath = getAttachmentFilePath(message.metadata);

  await db.query<ResultSetHeader>(
    `UPDATE messages
     SET deleted_at = NOW(),
         content = NULL,
         metadata = NULL
     WHERE id = ?`,
    [message.id],
  );

  await deleteUploadedFile(filePath);
  await finishReport(
    adminId,
    reportId,
    "reviewed",
    "delete_message",
    adminReason.trim(),
  );

  await createNotification({
    userId: Number(message.sender_id),
    type: "admin_warning",
    actorUserId: adminId,
    adminReason: adminReason.trim(),
  });
};

export const warnChatUser = async (
  adminId: number,
  reportId: number,
  adminReason: string,
): Promise<void> => {
  if (!adminReason?.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  const report = await getOpenChatReport(reportId);

  await db.query<ResultSetHeader>(
    `INSERT INTO user_penalties (user_id, admin_id, type, reason)
     VALUES (?, ?, 'warning', ?)`,
    [report.target_user_id, adminId, adminReason.trim()],
  );

  await db.query(
    `INSERT INTO user_chat_status (user_id, strike_count)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE strike_count = strike_count + 1`,
    [report.target_user_id],
  );

  await finishReport(adminId, reportId, "reviewed", "warn", adminReason.trim());

  await createNotification({
    userId: Number(report.target_user_id),
    type: "admin_warning",
    actorUserId: adminId,
    adminReason: adminReason.trim(),
  });
};

export const muteChatUser = async (
  adminId: number,
  reportId: number,
  adminReason: string,
  mutedUntil: string,
): Promise<void> => {
  if (!adminReason?.trim() || !mutedUntil) {
    throw new ServiceError("Admin reason and mute date are required", 400);
  }

  const report = await getOpenChatReport(reportId);

  await db.query<ResultSetHeader>(
    `INSERT INTO user_penalties (user_id, admin_id, type, reason, muted_until)
     VALUES (?, ?, 'mute', ?, ?)`,
    [report.target_user_id, adminId, adminReason.trim(), mutedUntil],
  );

  await db.query(
    `INSERT INTO user_chat_status (user_id, muted_until, strike_count)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE muted_until = VALUES(muted_until), strike_count = strike_count + 1`,
    [report.target_user_id, mutedUntil],
  );

  await finishReport(adminId, reportId, "reviewed", "mute", adminReason.trim());

  await createNotification({
    userId: Number(report.target_user_id),
    type: "chat_muted",
    actorUserId: adminId,
    adminReason: adminReason.trim(),
  });
};

export const banChatUser = async (
  adminId: number,
  reportId: number,
  adminReason: string,
  isPermanent: boolean,
  bannedUntil?: string | null,
): Promise<void> => {
  if (!adminReason?.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  if (!isPermanent && !bannedUntil) {
    throw new ServiceError("Temporary ban date is required", 400);
  }

  const report = await getOpenChatReport(reportId);
  const action: ChatReportAction = isPermanent
    ? "permanent_chat_ban"
    : "temporary_chat_ban";

  await db.query<ResultSetHeader>(
    `INSERT INTO user_penalties
      (user_id, admin_id, type, reason, banned_until, is_permanent)
     VALUES (?, ?, 'chat_ban', ?, ?, ?)`,
    [
      report.target_user_id,
      adminId,
      adminReason.trim(),
      isPermanent ? null : bannedUntil,
      isPermanent,
    ],
  );

  await db.query(
    `INSERT INTO user_chat_status
      (user_id, is_chat_banned, chat_banned_until, strike_count)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       is_chat_banned = VALUES(is_chat_banned),
       chat_banned_until = VALUES(chat_banned_until),
       strike_count = strike_count + 1`,
    [
      report.target_user_id,
      isPermanent,
      isPermanent ? null : bannedUntil,
    ],
  );

  await finishReport(adminId, reportId, "reviewed", action, adminReason.trim());

  await createNotification({
    userId: Number(report.target_user_id),
    type: "chat_banned",
    actorUserId: adminId,
    adminReason: adminReason.trim(),
  });
};

export const deleteReviewedChatReport = async (
  reportId: number,
): Promise<void> => {
  ensureInteger(reportId, "Invalid report id");

  const [result] = await db.query<ResultSetHeader>(
    `DELETE FROM chat_reports
     WHERE id = ? AND status IN ('reviewed', 'rejected')`,
    [reportId],
  );

  if (result.affectedRows === 0) {
    throw new ServiceError(
      "Only reviewed or rejected chat reports can be deleted",
      409,
    );
  }
};
