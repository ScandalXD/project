import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { chatReportsApi } from "../../api/chatReportsApi";
import { reportApi } from "../../api/reportApi";
import RejectReportModal from "../../components/reports/RejectReportModal";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import type { ChatReport } from "../../types/chatReport";
import type { ReportItem, ReportStatus } from "../../types/report";

type ReportTypeFilter = "all" | "content" | "chat";

type ContentAdminAction =
  | null
  | {
      type: "hideCocktail";
      reportId: number;
    }
  | {
      type: "deleteComment";
      reportId: number;
    };

type ChatAdminAction =
  | "dismiss"
  | "deleteMessage"
  | "warn"
  | "mute"
  | "temporaryBan"
  | "permanentBan";

type PendingChatAction = {
  report: ChatReport;
  action: ChatAdminAction;
};

type CombinedReport =
  | { kind: "content"; report: ReportItem; createdAt: string }
  | { kind: "chat"; report: ChatReport; createdAt: string };

const chatActionLabels: Record<ChatAdminAction, string> = {
  dismiss: "Dismiss report",
  deleteMessage: "Delete message",
  warn: "Warn user",
  mute: "Mute user",
  temporaryBan: "Temporary chat ban",
  permanentBan: "Permanent chat ban",
};

const chatActionsWithDate: ChatAdminAction[] = ["mute", "temporaryBan"];

function getContentTargetLabel(report: ReportItem) {
  if (report.target_type === "public_cocktail") return "Public cocktail";
  if (report.target_type === "comment") return "Comment";
  return report.target_type;
}

function getStatusClass(status: ReportStatus) {
  if (status === "open") return "pending";
  if (status === "reviewed") return "approved";
  return "rejected";
}

export default function AdminReportsPage() {
  const [contentReports, setContentReports] = useState<ReportItem[]>([]);
  const [chatReports, setChatReports] = useState<ChatReport[]>([]);
  const [status, setStatus] = useState<ReportStatus | "all">("open");
  const [reportType, setReportType] = useState<ReportTypeFilter>("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [deleteContentReportId, setDeleteContentReportId] = useState<number | null>(null);
  const [deleteChatReportId, setDeleteChatReportId] = useState<number | null>(null);
  const [rejectReportId, setRejectReportId] = useState<number | null>(null);
  const [contentAction, setContentAction] = useState<ContentAdminAction>(null);
  const [chatAction, setChatAction] = useState<PendingChatAction | null>(null);
  const [adminReason, setAdminReason] = useState("");
  const [untilDate, setUntilDate] = useState("");

  const loadReports = async () => {
    try {
      setError("");
      setIsLoading(true);

      const statusParam = status === "all" ? undefined : status;
      const [contentData, chatData] = await Promise.all([
        reportType === "chat"
          ? Promise.resolve([])
          : reportApi.getAdminReports(statusParam),
        reportType === "content"
          ? Promise.resolve([])
          : chatReportsApi.getAdminReports(statusParam),
      ]);

      setContentReports(contentData);
      setChatReports(chatData);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [status, reportType]);

  const combinedReports = useMemo<CombinedReport[]>(() => {
    return [
      ...contentReports.map((report) => ({
        kind: "content" as const,
        report,
        createdAt: report.created_at,
      })),
      ...chatReports.map((report) => ({
        kind: "chat" as const,
        report,
        createdAt: report.created_at,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [contentReports, chatReports]);

  const handleRejectContentReport = async (reason: string) => {
    if (!rejectReportId) return;

    setError("");
    setMessage("");

    try {
      await reportApi.rejectReport(rejectReportId, reason);
      setMessage("Report rejected.");
      setRejectReportId(null);
      await loadReports();
    } catch {
      setError("Failed to reject report.");
    }
  };

  const handleDeleteContentReport = async () => {
    if (!deleteContentReportId) return;

    setError("");
    setMessage("");

    try {
      await reportApi.deleteReviewedReport(deleteContentReportId);
      setMessage("Report deleted.");
      setDeleteContentReportId(null);
      await loadReports();
    } catch {
      setError("Failed to delete report.");
    }
  };

  const handleDeleteChatReport = async () => {
    if (!deleteChatReportId) return;

    setError("");
    setMessage("");

    try {
      await chatReportsApi.deleteReviewedReport(deleteChatReportId);
      setMessage("Chat report deleted.");
      setDeleteChatReportId(null);
      await loadReports();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete chat report.");
    }
  };

  const handleContentActionSubmit = async () => {
    if (!contentAction || !adminReason.trim()) return;

    setError("");
    setMessage("");

    try {
      if (contentAction.type === "hideCocktail") {
        await reportApi.hidePublicCocktailFromReport(
          contentAction.reportId,
          adminReason.trim(),
        );
        setMessage("Public cocktail hidden.");
      }

      if (contentAction.type === "deleteComment") {
        await reportApi.deleteCommentFromReport(
          contentAction.reportId,
          adminReason.trim(),
        );
        setMessage("Comment deleted.");
      }

      setContentAction(null);
      setAdminReason("");
      await loadReports();
    } catch {
      setError("Action failed.");
    }
  };

  const openChatActionModal = (report: ChatReport, action: ChatAdminAction) => {
    setError("");
    setMessage("");
    setAdminReason("");
    setUntilDate("");
    setChatAction({ report, action });
  };

  const closeChatActionModal = () => {
    setChatAction(null);
    setAdminReason("");
    setUntilDate("");
  };

  const handleChatActionSubmit = async () => {
    if (!chatAction) return;

    if (!adminReason.trim()) {
      setError("Admin reason is required.");
      return;
    }

    if (chatActionsWithDate.includes(chatAction.action) && !untilDate) {
      setError("Date is required for this action.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const reportId = chatAction.report.id;

      if (chatAction.action === "dismiss") {
        await chatReportsApi.dismiss(reportId, adminReason.trim());
      }

      if (chatAction.action === "deleteMessage") {
        await chatReportsApi.deleteMessage(reportId, adminReason.trim());
      }

      if (chatAction.action === "warn") {
        await chatReportsApi.warn(reportId, adminReason.trim());
      }

      if (chatAction.action === "mute") {
        await chatReportsApi.mute(reportId, adminReason.trim(), untilDate);
      }

      if (chatAction.action === "temporaryBan") {
        await chatReportsApi.ban(reportId, adminReason.trim(), false, untilDate);
      }

      if (chatAction.action === "permanentBan") {
        await chatReportsApi.ban(reportId, adminReason.trim(), true);
      }

      setMessage("Action completed.");
      closeChatActionModal();
      await loadReports();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Action failed.");
    }
  };

  const renderContentReport = (report: ReportItem) => (
    <div
      key={`content-${report.id}`}
      className={`admin-card ${report.status !== "open" ? "admin-card-muted" : ""}`}
    >
      <div className="admin-card-title-row">
        <h3>#{report.id} — {getContentTargetLabel(report)}</h3>
        <span className={`status-badge status-${getStatusClass(report.status)}`}>
          {report.status}
        </span>
      </div>

      <p><strong>Type:</strong> Content report</p>
      <p><strong>Reporter:</strong> {report.reporter_nickname}</p>
      <p><strong>Target ID:</strong> {report.target_id}</p>
      <p><strong>Reason:</strong> {report.reason}</p>
      {report.details && <p><strong>Details:</strong> {report.details}</p>}
      {report.comment_content && (
        <p><strong>Comment:</strong> {report.comment_content}</p>
      )}
      <p>
        <strong>Created:</strong>{" "}
        {new Date(report.created_at).toLocaleString("pl-PL")}
      </p>
      {report.reviewed_at && (
        <p>
          <strong>Reviewed:</strong>{" "}
          {new Date(report.reviewed_at).toLocaleString("pl-PL")}
        </p>
      )}
      {report.reviewed_by_nickname && (
        <p><strong>Reviewed by:</strong> {report.reviewed_by_nickname}</p>
      )}
      {report.admin_reason && (
        <p className="error-text">
          <strong>Admin reason:</strong> {report.admin_reason}
        </p>
      )}

      <details className="report-action-panel">
        <summary>
          <span>Actions</span>
        </summary>

        <div className="report-actions">
          {report.target_type === "public_cocktail" && (
            <Link
              to={`/public-cocktails/${report.target_id}`}
              className="admin-create-link"
            >
              View cocktail
            </Link>
          )}

          {report.target_type === "comment" &&
            report.comment_cocktail_type === "public" && (
              <Link
                to={`/public-cocktails/${report.comment_cocktail_id}#comment-${report.target_id}`}
                className="admin-create-link"
              >
                View comment
              </Link>
            )}

          {report.status === "open" && (
            <>
              <Button
                variant="warning"
                onClick={() => setRejectReportId(report.id)}
              >
                Reject report
              </Button>

              {report.target_type === "public_cocktail" && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setContentAction({ type: "hideCocktail", reportId: report.id });
                    setAdminReason("");
                  }}
                >
                  Hide cocktail
                </Button>
              )}

              {report.target_type === "comment" && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setContentAction({ type: "deleteComment", reportId: report.id });
                    setAdminReason("");
                  }}
                >
                  Delete comment
                </Button>
              )}
            </>
          )}

          {report.status !== "open" && (
            <Button
              variant="danger"
              onClick={() => setDeleteContentReportId(report.id)}
            >
              Delete report
            </Button>
          )}
        </div>
      </details>
    </div>
  );

  const renderChatReport = (report: ChatReport) => (
    <div
      key={`chat-${report.id}`}
      className={`admin-card ${report.status !== "open" ? "admin-card-muted" : ""}`}
    >
      <div className="admin-card-title-row">
        <h3>#{report.id} {report.target_type}</h3>
        <span className={`status-badge status-${getStatusClass(report.status)}`}>
          {report.status}
        </span>
      </div>

      <p><strong>Type:</strong> Chat report</p>
      <p><strong>Reporter:</strong> {report.reporter_nickname}</p>
      <p><strong>Target:</strong> {report.target_nickname}</p>
      <p><strong>Reason:</strong> {report.reason}</p>
      {report.details && <p><strong>Details:</strong> {report.details}</p>}
      {report.message_content && (
        <p><strong>Message:</strong> {report.message_content}</p>
      )}
      <p>
        <strong>Created:</strong>{" "}
        {new Date(report.created_at).toLocaleString("pl-PL")}
      </p>
      {report.admin_reason && (
        <p className="muted-text">
          <strong>Admin reason:</strong> {report.admin_reason}
        </p>
      )}

      <details className="report-action-panel">
        <summary>
          <span>Actions</span>
        </summary>

        {report.status === "open" && (
          <div className="report-actions">
            <Button
              variant="secondary"
              onClick={() => openChatActionModal(report, "dismiss")}
            >
              Dismiss
            </Button>
            {report.message_id && (
              <Button
                variant="danger"
                onClick={() => openChatActionModal(report, "deleteMessage")}
              >
                Delete message
              </Button>
            )}
            <Button
              variant="warning"
              onClick={() => openChatActionModal(report, "warn")}
            >
              Warn
            </Button>
            <Button onClick={() => openChatActionModal(report, "mute")}>
              Mute
            </Button>
            <Button
              variant="danger"
              onClick={() => openChatActionModal(report, "temporaryBan")}
            >
              Temp ban
            </Button>
            <Button
              variant="danger"
              onClick={() => openChatActionModal(report, "permanentBan")}
            >
              Permanent ban
            </Button>
          </div>
        )}

        {report.status !== "open" && (
          <div className="report-actions">
            <Button
              variant="danger"
              onClick={() => setDeleteChatReportId(report.id)}
            >
              Delete report
            </Button>
          </div>
        )}
      </details>
    </div>
  );

  if (isLoading) {
    return <div className="page-container">Loading reports...</div>;
  }

  return (
    <div className="page-container">
      <Link to="/admin" className="page-back-button admin-dashboard-back">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>Dashboard</span>
      </Link>

      <div className="admin-page-header">
        <h1>Admin Reports</h1>

        <div className="reports-filter-row">
          <Select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ReportStatus | "all")
            }
          >
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </Select>

          <Select
            value={reportType}
            onChange={(event) =>
              setReportType(event.target.value as ReportTypeFilter)
            }
          >
            <option value="all">All types</option>
            <option value="content">Content reports</option>
            <option value="chat">Chat reports</option>
          </Select>
        </div>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {combinedReports.length === 0 ? (
        <EmptyState text="No reports found" />
      ) : (
        <div className="admin-grid">
          {combinedReports.map((item) =>
            item.kind === "content"
              ? renderContentReport(item.report)
              : renderChatReport(item.report),
          )}
        </div>
      )}

      <RejectReportModal
        isOpen={rejectReportId !== null}
        onClose={() => setRejectReportId(null)}
        onReject={handleRejectContentReport}
      />

      {contentAction && (
        <Modal
          title={
            contentAction.type === "hideCocktail"
              ? "Hide public cocktail"
              : "Delete comment"
          }
          onClose={() => {
            setContentAction(null);
            setAdminReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setContentAction(null);
                  setAdminReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!adminReason.trim()}
                onClick={handleContentActionSubmit}
              >
                Confirm
              </Button>
            </>
          }
        >
          <p className="muted-text">Provide admin reason:</p>
          <Input
            value={adminReason}
            onChange={(event) => setAdminReason(event.target.value)}
            placeholder="Admin reason"
          />
        </Modal>
      )}

      {chatAction && (
        <Modal
          title={chatActionLabels[chatAction.action]}
          onClose={closeChatActionModal}
          footer={
            <>
              <Button variant="secondary" onClick={closeChatActionModal}>
                Cancel
              </Button>
              <Button
                variant={
                  ["deleteMessage", "temporaryBan", "permanentBan"].includes(
                    chatAction.action,
                  )
                    ? "danger"
                    : chatAction.action === "warn"
                      ? "warning"
                      : "primary"
                }
                onClick={handleChatActionSubmit}
              >
                Confirm
              </Button>
            </>
          }
        >
          <div className="modal-form">
            <p className="muted-text">
              Report #{chatAction.report.id} against{" "}
              {chatAction.report.target_nickname}
            </p>
            <Input
              value={adminReason}
              onChange={(event) => setAdminReason(event.target.value)}
              placeholder="Admin reason"
            />
            {chatActionsWithDate.includes(chatAction.action) && (
              <Input
                type="datetime-local"
                value={untilDate}
                onChange={(event) => setUntilDate(event.target.value)}
              />
            )}
          </div>
        </Modal>
      )}

      {deleteContentReportId && (
        <Modal
          title="Delete report"
          onClose={() => setDeleteContentReportId(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleteContentReportId(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteContentReport}>
                Delete
              </Button>
            </>
          }
        >
          <p className="muted-text">
            Are you sure you want to delete this reviewed or rejected report?
          </p>
        </Modal>
      )}

      {deleteChatReportId && (
        <Modal
          title="Delete chat report"
          onClose={() => setDeleteChatReportId(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleteChatReportId(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteChatReport}>
                Delete
              </Button>
            </>
          }
        >
          <p className="muted-text">
            Are you sure you want to delete this reviewed or rejected chat report?
          </p>
        </Modal>
      )}
    </div>
  );
}
