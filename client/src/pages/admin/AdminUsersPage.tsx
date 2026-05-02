import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { useAuth } from "../../hooks/useAuth";

type UserRole = "user" | "admin" | "superadmin";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "users" | "admins">("all");

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch {
      setError("Failed to fetch users.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeactivate = async (id: number) => {
    try {
      await adminApi.deactivateUser(id);
      await loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to deactivate user.");
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await adminApi.reactivateUser(id);
      await loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update user role.");
    }
  };

  const handleRoleChange = async (userId: number, role: UserRole) => {
    const confirmed = window.confirm(`Change user role to ${role}?`);
    if (!confirmed) return;

    try {
      await adminApi.updateUserRole(userId, role);
      await loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update user role.");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filter === "users") return u.role === "user";
    if (filter === "admins") {
      return u.role === "admin" || u.role === "superadmin";
    }

    return true;
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1>Admin Users</h1>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("users")}>Users</button>
        <button onClick={() => setFilter("admins")}>Admins</button>
      </div>

      {filteredUsers.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                background: "#ffffff",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p>
                <strong>Nickname:</strong> {user.nickname}
              </p>
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

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                {user.is_active ? (
                  <button onClick={() => handleDeactivate(user.id)}>
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => handleReactivate(user.id)}>
                    Reactivate
                  </button>
                )}

                {currentUser?.role === "superadmin" &&
                  user.role !== "superadmin" && (
                    <>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleRoleChange(user.id, "admin")}
                        >
                          Make admin
                        </button>
                      )}

                      {user.role !== "user" && (
                        <button
                          onClick={() => handleRoleChange(user.id, "user")}
                        >
                          Make user
                        </button>
                      )}
                    </>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
