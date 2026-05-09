import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface RejectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}

export default function RejectReportModal({
  isOpen,
  onClose,
  onReject,
}: RejectReportModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReject = async () => {
    if (!reason.trim()) return;

    setIsSubmitting(true);

    try {
      await onReject(reason.trim());

      setReason("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Reject report"
      onClose={onClose}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            disabled={!reason.trim() || isSubmitting}
            onClick={handleReject}
          >
            Reject
          </Button>
        </>
      }
    >
      <p className="muted-text">
        Provide a reason for rejection:
      </p>

      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
      />
    </Modal>
  );
}