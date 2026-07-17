import { useState } from "react";
import type { ChatReportReason } from "../../types/chatReport";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

const reasons: Array<{ value: ChatReportReason; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "abuse", label: "Abuse" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "scam", label: "Scam" },
  { value: "fake_account", label: "Fake account" },
  { value: "other", label: "Other" },
];

interface ReportMessageModalProps {
  title?: string;
  onClose: () => void;
  onSubmit: (reason: ChatReportReason, details: string) => Promise<void>;
}

export default function ReportMessageModal({
  title = "Report message",
  onClose,
  onSubmit,
}: ReportMessageModalProps) {
  const [reason, setReason] = useState<ChatReportReason>("spam");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(reason, details.trim());
    setIsSubmitting(false);
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      className="report-modal-backdrop"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Report
          </Button>
        </>
      }
    >
      <div className="modal-form">
        <select
          className="app-select report-reason-select"
          value={reason}
          onChange={(event) => setReason(event.target.value as ChatReportReason)}
        >
          {reasons.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <Input
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Details optional"
        />
      </div>
    </Modal>
  );
}
