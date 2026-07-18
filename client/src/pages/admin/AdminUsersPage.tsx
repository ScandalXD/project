import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import BackButton from "../../components/ui/BackButton";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

type AdminUserRole = "user" | "admin" | "superadmin";

interface AdminUser {
  id: number;
  nickname: string;
  email: string;
  role: AdminUserRole;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      setError("");

      const data = await adminApi.getUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (
    userId: number,
    role: Exclude<AdminUserRole, "superadmin">
  ) => {
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

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="empty-state">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <BackButton to="/admin" label="Dashboard" />

      <div className="admin-page-header">
        <div>
          <h1>Admin Users</h1>
          <p className="muted-text">
            Manage user roles and account status.
          </p>
        </div>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {users.length === 0 ? (
        <EmptyState text="No users found" />
      ) : (
        <div className="admin-users-grid">
          {users.map((user) => (
            <div key={user.id} className="admin-card">
              <div className="admin-user-card-header">
                <div>
                  <h3 className="admin-user-title">{user.nickname}</h3>
                  <p className="muted-text admin-user-email">{user.email}</p>
                </div>

                <div className="admin-user-badges">
                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>

                  <span
                    className={`status-badge ${
                      user.is_active ? "status-approved" : "status-rejected"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

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
