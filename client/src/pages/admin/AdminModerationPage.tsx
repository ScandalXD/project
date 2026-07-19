import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import Button from "../../components/ui/Button";
import BackButton from "../../components/ui/BackButton";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";

export default function AdminModerationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    try {
      const data = await adminApi.getPendingCocktails();
      setItems(data);
    } catch {
      setError("Failed to download cocktails for moderation.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: number) => {
    setError("");
    try {
      await adminApi.approveCocktail(id);
      await load();
    } catch {
      setError("Failed to approve cocktail.");
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;

    setError("");

    try {
      await adminApi.rejectCocktail(rejectId, rejectReason.trim());
      setRejectId(null);
      setRejectReason("");
      await load();
    } catch {
      setError("Couldn't reject the cocktail.");
    }
  };

  return (
    <div className="page-container">
      <BackButton to="/admin" label="Dashboard" />

      <div className="admin-page-header">
        <h1>Admin Moderation</h1>
      </div>

      {error && <p className="error-text">{error}</p>}

      {items.length === 0 ? (
        <EmptyState text="No pending cocktails" />
      ) : (
        <div className="admin-grid">
          {items.map((c) => (
            <div key={c.id} className="admin-card">
              {c.image && (
                <img
                  src={getImageUrl(c.image)}
                  alt={c.name}
                  className="admin-card-image"
                />
              )}

              <h3>{c.name}</h3>
              <p>
                <strong>Author:</strong>{" "}
                <Link to={`/authors/${c.owner_id}`}>{c.owner_nickname}</Link>
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {c.submitted_at
                  ? new Date(c.submitted_at).toLocaleString("pl-PL")
                  : "—"}
              </p>
              <p>
                <strong>Category:</strong> {formatCocktailCategory(c.category)}
              </p>
              <p>
                <strong>Ingredients:</strong> {c.ingredients}
              </p>
              <p>
                <strong>Instructions:</strong> {c.instructions}
              </p>

              <div className="admin-card-actions">
                <Button onClick={() => handleApprove(c.id)}>Approve</Button>

                <Button
                  variant="danger"
                  onClick={() => {
                    setRejectId(c.id);
                    setRejectReason("");
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectId && (
        <Modal
          title="Reject cocktail"
          onClose={() => {
            setRejectId(null);
            setRejectReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setRejectId(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                disabled={!rejectReason.trim()}
                onClick={handleReject}
              >
                Reject
              </Button>
            </>
          }
        >
          <p className="muted-text">Provide a reason for rejection:</p>

          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason"
          />
        </Modal>
      )}
    </div>
  );
}
