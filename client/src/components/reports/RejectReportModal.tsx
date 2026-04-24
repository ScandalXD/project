interface RejectReportModalProps {
  reason: string;
  isLoading: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function RejectReportModal({
  reason,
  isLoading,
  onReasonChange,
  onClose,
  onSubmit,
}: RejectReportModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "90%",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Reject report</h2>

        <p style={{ color: "#6b7280" }}>
          Write why this report was rejected.
        </p>

        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Example: No violation found..."
          rows={5}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              padding: "10px 14px",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={isLoading || !reason.trim()}
            style={{
              border: "none",
              background: "#dc2626",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "10px",
              cursor: isLoading || !reason.trim() ? "not-allowed" : "pointer",
              opacity: isLoading || !reason.trim() ? 0.6 : 1,
            }}
          >
            {isLoading ? "Rejecting..." : "Reject report"}
          </button>
        </div>
      </div>
    </div>
  );
}