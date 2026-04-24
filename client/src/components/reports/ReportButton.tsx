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

  const closeModal = () => {
    setIsOpen(false);
    setReason("");
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setIsLoading(true);

    try {
      if (type === "cocktail") {
        await reportApi.reportCocktail(id, reason.trim());
      } else {
        await reportApi.reportComment(id, reason.trim());
      }

      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to send report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          border: "none",
          background: "#dc2626",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Report
      </button>

      {isOpen && (
        <ReportModal
          type={type}
          reason={reason}
          isLoading={isLoading}
          onReasonChange={setReason}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
