import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reportApi } from "../../api/reportApi";
import type { ReportItem } from "../../types/report";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import RejectReportModal from "../../components/reports/RejectReportModal";

type AdminAction =
  | null
  | {
      type: "hideCocktail";
      reportId: number;
    }
  | {
      type: "deleteComment";
      reportId: number;
    };

function getTargetLabel(report: ReportItem) {
  if (report.target_type === "public_cocktail") return "Public cocktail";
  if (report.target_type === "comment") return "Comment";
  return report.target_type;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteReportId, setDeleteReportId] = useState<number | null>(null);
  const [rejectReportId, setRejectReportId] = useState<number | null>(null);
  const [adminAction, setAdminAction] = useState<AdminAction>(null);
  const [adminReason, setAdminReason] = useState("");

  const loadReports = async () => {
    try {
      const data = await reportApi.getAdminReports();
      setReports(data);
    } catch {
      setError("Nie udało się pobrać zgłoszeń.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleRejectReport = async (reason: string) => {
    if (!rejectReportId) return;

    setError("");
    setMessage("");

    try {
      await reportApi.rejectReport(rejectReportId, reason);
      setMessage("Report rejected.");
      setRejectReportId(null);
      await loadReports();
    } catch {
      setError("Nie udało się odrzucić zgłoszenia.");
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteReportId) return;

    setError("");
    setMessage("");

    try {
      await reportApi.deleteReviewedReport(deleteReportId);
      setMessage("Report deleted.");
      setDeleteReportId(null);
      await loadReports();
    } catch {
      setError("Nie udało się usunąć zgłoszenia.");
    }
  };

  const handleAdminActionSubmit = async () => {
    if (!adminAction || !adminReason.trim()) return;

    setError("");
    setMessage("");

    try {
      if (adminAction.type === "hideCocktail") {
        await reportApi.hidePublicCocktailFromReport(
          adminAction.reportId,
          adminReason.trim(),
        );

        setMessage("Public cocktail hidden.");
      }

      if (adminAction.type === "deleteComment") {
        await reportApi.deleteCommentFromReport(
          adminAction.reportId,
          adminReason.trim(),
        );

        setMessage("Comment deleted.");
      }

      setAdminAction(null);
      setAdminReason("");
      await loadReports();
    } catch {
      setError("Action failed.");
    }
  };

  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <h1>Admin Reports</h1>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {reports.length === 0 ? (
        <EmptyState text="No reports found" />
      ) : (
        <div className="admin-grid">
          {reports.map((report) => (
            <div
              key={report.id}
              className="admin-card"
              style={{
                opacity: report.status === "reviewed" ? 0.7 : 1,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                #{report.id} — {getTargetLabel(report)}
              </h3>

              <p>
                <strong>Status:</strong> {report.status}
              </p>

              <p>
                <strong>Reporter:</strong> {report.reporter_nickname}
              </p>

              <p>
                <strong>Target ID:</strong> {report.target_id}
              </p>

              <p>
                <strong>Reason:</strong> {report.reason}
              </p>

              {report.details && (
                <p>
                  <strong>Details:</strong> {report.details}
                </p>
              )}

              {report.comment_content && (
                <p>
                  <strong>Comment:</strong> {report.comment_content}
                </p>
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
                <p>
                  <strong>Reviewed by:</strong> {report.reviewed_by_nickname}
                </p>
              )}

              {report.admin_reason && (
                <p className="error-text">
                  <strong>Admin reason:</strong> {report.admin_reason}
                </p>
              )}

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
                          setAdminAction({
                            type: "hideCocktail",
                            reportId: report.id,
                          });
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
                          setAdminAction({
                            type: "deleteComment",
                            reportId: report.id,
                          });
                          setAdminReason("");
                        }}
                      >
                        Delete comment
                      </Button>
                    )}
                  </>
                )}

                {report.status === "reviewed" && (
                  <Button
                    variant="danger"
                    onClick={() => setDeleteReportId(report.id)}
                  >
                    Delete report
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RejectReportModal
        isOpen={rejectReportId !== null}
        onClose={() => setRejectReportId(null)}
        onReject={handleRejectReport}
      />

      {adminAction && (
        <Modal
          title={
            adminAction.type === "hideCocktail"
              ? "Hide public cocktail"
              : "Delete comment"
          }
          onClose={() => {
            setAdminAction(null);
            setAdminReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setAdminAction(null);
                  setAdminReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                disabled={!adminReason.trim()}
                onClick={handleAdminActionSubmit}
              >
                Confirm
              </Button>
            </>
          }
        >
          <p className="muted-text">Provide admin reason:</p>

          <Input
            value={adminReason}
            onChange={(e) => setAdminReason(e.target.value)}
            placeholder="Admin reason"
          />
        </Modal>
      )}
      {deleteReportId && (
        <Modal
          title="Delete report"
          onClose={() => setDeleteReportId(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleteReportId(null)}
              >
                Cancel
              </Button>

              <Button variant="danger" onClick={handleDeleteReport}>
                Delete
              </Button>
            </>
          }
        >
          <p className="muted-text">
            Are you sure you want to delete this reviewed report?
          </p>
        </Modal>
      )}
    </div>
  );
}
