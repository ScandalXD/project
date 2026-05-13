import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface ReportModalProps {
  type: "cocktail" | "comment";
  reason: string;
  error?: string;
  isLoading: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ReportModal({
  type,
  reason,
  error = "",
  isLoading,
  onReasonChange,
  onClose,
  onSubmit,
}: ReportModalProps) {
  return (
    <Modal
      title={`Report ${type}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="danger"
            disabled={isLoading || !reason.trim()}
            onClick={onSubmit}
          >
            {isLoading ? "Sending..." : "Send report"}
          </Button>
        </>
      }
    >
      <div className="modal-form">
        <p className="muted-text">
          Describe why you want to report this {type}.
        </p>

        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Report reason"
          rows={4}
          className="app-textarea"
        />

        {error && <p className="error-text">{error}</p>}
      </div>
    </Modal>
  );
}