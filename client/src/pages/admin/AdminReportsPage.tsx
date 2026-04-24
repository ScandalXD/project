import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reportApi } from "../../api/reportApi";
import type { ReportItem } from "../../types/report";
import RejectReportModal from "../../components/reports/RejectReportModal";

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
  const [rejectReportId, setRejectReportId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

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

  const handleMarkReviewed = async (id: number) => {
    setError("");
    setMessage("");

    try {
      await reportApi.markReportReviewed(id);
      setMessage("Report marked as reviewed.");
      await loadReports();
    } catch {
      setError("Nie udało się oznaczyć zgłoszenia jako sprawdzone.");
    }
  };

  const handleRejectReport = async () => {
    if (!rejectReportId || !rejectReason.trim()) return;

    setError("");
    setMessage("");
    setIsRejecting(true);

    try {
      await reportApi.rejectReport(rejectReportId, rejectReason.trim());
      setMessage("Report rejected.");
      setRejectReportId(null);
      setRejectReason("");
      await loadReports();
    } catch {
      setError("Nie udało się odrzucić zgłoszenia.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm("Delete this reviewed report?")) return;

    setError("");
    setMessage("");

    try {
      await reportApi.deleteReviewedReport(id);
      setMessage("Report deleted.");
      await loadReports();
    } catch {
      setError("Nie udało się usunąć zgłoszenia.");
    }
  };

  const handleHideCocktail = async (id: number) => {
    const reason = window.prompt("Admin reason for hiding cocktail:");
    if (!reason?.trim()) return;

    setError("");
    setMessage("");

    try {
      await reportApi.hidePublicCocktailFromReport(id, reason.trim());
      setMessage("Public cocktail hidden.");
      await loadReports();
    } catch {
      setError("Nie udało się ukryć koktajlu.");
    }
  };

  const handleDeleteComment = async (id: number) => {
    const reason = window.prompt("Admin reason for deleting comment:");
    if (!reason?.trim()) return;

    setError("");
    setMessage("");

    try {
      await reportApi.deleteCommentFromReport(id, reason.trim());
      setMessage("Comment deleted.");
      await loadReports();
    } catch {
      setError("Nie udało się usunąć komentarza.");
    }
  };

  if (isLoading) return <div>Loading reports...</div>;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1>Admin Reports</h1>

      {message && <p style={{ color: "#059669" }}>{message}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {reports.map((report) => (
            <div
              key={report.id}
              style={{
                background: "#ffffff",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
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
                <p style={{ color: "#b91c1c" }}>
                  <strong>Admin reason:</strong> {report.admin_reason}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                {report.target_type === "public_cocktail" && (
                  <Link
                    to={`/public-cocktails/${report.target_id}`}
                    style={{
                      textDecoration: "none",
                      background: "#111827",
                      color: "#ffffff",
                      padding: "10px 14px",
                      borderRadius: "10px",
                    }}
                  >
                    View cocktail
                  </Link>
                )}

                {report.target_type === "comment" &&
                  report.comment_cocktail_type === "public" && (
                    <Link
                      to={`/public-cocktails/${report.comment_cocktail_id}#comment-${report.target_id}`}
                      style={{
                        textDecoration: "none",
                        background: "#111827",
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "10px",
                      }}
                    >
                      View comment
                    </Link>
                  )}

                {report.status === "open" && (
                  <>
                    <button onClick={() => handleMarkReviewed(report.id)}>
                      Mark reviewed
                    </button>

                    <button
                      onClick={() => {
                        setRejectReportId(report.id);
                        setRejectReason("");
                      }}
                    >
                      Reject report
                    </button>

                    {report.target_type === "public_cocktail" && (
                      <button onClick={() => handleHideCocktail(report.id)}>
                        Hide cocktail
                      </button>
                    )}

                    {report.target_type === "comment" && (
                      <button onClick={() => handleDeleteComment(report.id)}>
                        Delete comment
                      </button>
                    )}
                  </>
                )}

                {report.status === "reviewed" && (
                  <button onClick={() => handleDeleteReport(report.id)}>
                    Delete report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {rejectReportId && (
        <RejectReportModal
          reason={rejectReason}
          isLoading={isRejecting}
          onReasonChange={setRejectReason}
          onClose={() => {
            setRejectReportId(null);
            setRejectReason("");
          }}
          onSubmit={handleRejectReport}
        />
      )}
    </div>
  );
}
