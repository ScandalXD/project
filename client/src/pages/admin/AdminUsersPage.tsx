import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState("");

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
        } catch {
            setError("Failed to deactivate user.");
        }
    };

    const handleReactivate = async (id: number) => {
        try {
            await adminApi.reactivateUser(id);
            await loadUsers();
        } catch {
            setError("Failed to reactivate user.");
        }
    };

    return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1>Admin Users</h1>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                background: "#ffffff",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Nickname:</strong> {user.nickname}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p>
                <strong>Status:</strong>{" "}
                {user.is_active ? "Active" : "Inactive"}
              </p>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {user.is_active ? (
                  <button onClick={() => handleDeactivate(user.id)}>
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => handleReactivate(user.id)}>
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}