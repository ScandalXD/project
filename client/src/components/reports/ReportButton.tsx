import { useState } from "react";
import { reportApi } from "../../api/reportApi";
import ReportModal from "./ReportModal";

interface Props {
  type: "cocktail" | "comment";
  id: number;
}

export default function ReportButton({ type, id }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const closeModal = () => {
    setIsOpen(false);
    setReason("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      if (type === "cocktail") {
        await reportApi.reportCocktail(id, reason.trim());
      } else {
        await reportApi.reportComment(id, reason.trim());
      }

      closeModal();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to send report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="report-button"
      >
        Report
      </button>

      {isOpen && (
        <ReportModal
          type={type}
          reason={reason}
          error={error}
          isLoading={isLoading}
          onReasonChange={setReason}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}