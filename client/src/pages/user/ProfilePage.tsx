import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { profileApi } from "../../api/profileApi";
import { useAuth } from "../../hooks/useAuth";
import { authStorage } from "../../services/authStorage";

export default function ProfilePage() {
  const { user, token, setAuthData } = useAuth();

  const [form, setForm] = useState({
    name: "",
    nickname: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileApi.getProfile();

        setForm({
          name: profile.name,
          nickname: profile.nickname,
        });
      } catch {
        setError("Nie udało się pobrać profilu.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    try {
      const response = await profileApi.updateProfile(form);

      if (response.token) {
        setAuthData(response.token, response.user);
      } else if (token) {
        authStorage.setUser(response.user);
        setAuthData(token, response.user);
      }

      setMessage("Profil został zaktualizowany.");
    } catch {
      setError("Nie udało się zapisać zmian.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>My Profile</h1>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        Zarządzaj swoimi podstawowymi danymi.
      </p>

      <div style={{ marginBottom: "20px", color: "#374151" }}>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>

        {user?.role === "admin" && (
          <p>
            <strong>Role:</strong> {user.role}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
          }}
        />

        <input
          type="text"
          name="nickname"
          placeholder="Nickname"
          value={form.nickname}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
          }}
        />

        {message && <p style={{ color: "#059669", margin: 0 }}>{message}</p>}
        {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          style={{
            border: "none",
            background: "#111827",
            color: "#ffffff",
            padding: "12px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
