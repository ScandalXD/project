import { Request, Response } from "express";
import {
  createReport,
  getAllReports,
  markReportReviewed,
  hidePublicCocktailFromReport,
  deleteCommentFromReport,
  rejectReport,
  deleteReviewedReport,
} from "../services/report.service";
import { ServiceError } from "../services/cocktail.service";
import { ReportTargetType } from "../models/Report.model";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

interface CreateReportBody {
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  details?: string | null;
}

interface AdminModerationFromReportBody {
  adminReason: string;
}

export const createReportHandler = async (
  req: Request<{}, {}, CreateReportBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const reportId = await createReport({
      reporterUserId: req.user.id,
      targetType: req.body.targetType,
      targetId: Number(req.body.targetId),
      reason: req.body.reason,
      details: req.body.details,
    });

    res.status(201).json({
      message: "Report created",
      reportId,
    });
  } catch (e) {
    handleError(res, e);
  }
};

export const getReportsHandler = async (_req: Request, res: Response) => {
  try {
    const reports = await getAllReports();
    res.json(reports);
  } catch (e) {
    handleError(res, e);
  }
};

export const markReportReviewedHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await markReportReviewed(req.user.id, Number(req.params.id));
    res.json({ message: "Report marked as reviewed" });
  } catch (e) {
    handleError(res, e);
  }
};

export const hidePublicCocktailFromReportHandler = async (
  req: Request<{ id: string }, {}, AdminModerationFromReportBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await hidePublicCocktailFromReport(
      req.user.id,
      Number(req.params.id),
      req.body.adminReason
    );
    res.json({ message: "Public cocktail hidden from report" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteCommentFromReportHandler = async (
  req: Request<{ id: string }, {}, AdminModerationFromReportBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await deleteCommentFromReport(
      req.user.id,
      Number(req.params.id),
      req.body.adminReason
    );
    res.json({ message: "Comment deleted from report" });
  } catch (e) {
    handleError(res, e);
  }
};

export const rejectReportHandler = async (
  req: Request<{ id: string }, {}, AdminModerationFromReportBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await rejectReport(req.user.id, Number(req.params.id), req.body.adminReason);
    res.json({ message: "Report rejected" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteReviewedReportHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await deleteReviewedReport(Number(req.params.id));
    res.json({ message: "Report deleted" });
  } catch (e) {
    handleError(res, e);
  }
};