import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, role: "user" | "admin") => {
    setError("");
    setMessage("");

    try {
      await adminApi.updateUserRole(userId, role);

      setMessage("User role updated.");

      await loadUsers();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to update role.");
    }
  };

  const handleDeactivate = async (userId: number) => {
    setError("");
    setMessage("");

    try {
      await adminApi.deactivateUser(userId);

      setMessage("User deactivated.");

      await loadUsers();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to deactivate user.");
    }
  };

  const handleActivate = async (userId: number) => {
    setError("");
    setMessage("");

    try {
      await adminApi.reactivateUser(userId);

      setMessage("User activated.");

      await loadUsers();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to activate user.");
    }
  };

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <h1>Admin Users</h1>
      </div>

      {message && <p className="success-text">{message}</p>}

      {error && <p className="error-text">{error}</p>}

      {users.length === 0 ? (
        <EmptyState text="No users found" />
      ) : (
        <div className="admin-grid">
          {users.map((user) => (
            <div key={user.id} className="admin-card">
              <h3 style={{ marginTop: 0 }}>{user.nickname}</h3>

              <p>
                <strong>Email:</strong> {user.email}
              </p>

              <p>
                <strong>Role:</strong> {user.role}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {user.is_active ? "Active" : "Inactive"}
              </p>

              <p>
                <strong>Created:</strong>{" "}
                {new Date(user.created_at).toLocaleString("pl-PL")}
              </p>

              <div className="admin-card-actions">
                {user.role === "user" ? (
                  <Button
                    variant="warning"
                    onClick={() => handleRoleChange(user.id, "admin")}
                  >
                    Make admin
                  </Button>
                ) : (
                  user.role !== "superadmin" && (
                    <Button
                      variant="secondary"
                      onClick={() => handleRoleChange(user.id, "user")}
                    >
                      Remove admin
                    </Button>
                  )
                )}

                {user.is_active && user.role !== "superadmin" ? (
                  <Button
                    variant="danger"
                    onClick={() => handleDeactivate(user.id)}
                  >
                    Deactivate
                  </Button>
                ) : !user.is_active ? (
                  <Button
                    variant="primary"
                    onClick={() => handleActivate(user.id)}
                  >
                    Activate
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
