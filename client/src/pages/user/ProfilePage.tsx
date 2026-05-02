import {
  useEffect,
  useState,
  type SyntheticEvent,
  type CSSProperties,
} from "react";
import { profileApi } from "../../api/profileApi";
import { useAuth } from "../../hooks/useAuth";
import type { UpdateProfileRequest } from "../../types/user";

export default function ProfilePage() {
  const { user, setAuthData } = useAuth();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  const [nicknameDraft, setNicknameDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editingNickname, setEditingNickname] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileApi.getProfile();

        setNickname(data.nickname);
        setEmail(data.email);
        setNicknameDraft(data.nickname);
        setEmailDraft(data.email);
      } catch {
        setError("Failed to load profile.");
      }
    };

    loadProfile();
  }, []);

  const updateProfile = async (data: UpdateProfileRequest) => {
    setMessage("");
    setError("");

    try {
      const response = await profileApi.updateProfile(data);

      if (response.token) {
        setAuthData(response.token, response.user);
      }

      setNickname(response.user.nickname);
      setEmail(response.user.email);
      setNicknameDraft(response.user.nickname);
      setEmailDraft(response.user.email);

      setMessage("Profile updated successfully.");
    } catch {
      setError("Update failed.");
    }
  };

  const handlePasswordSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setEditingPassword(false);
      setMessage("Password updated successfully.");
    } catch {
      setError("Failed to update password.");
    }
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    fontSize: "15px",
    outline: "none",
  };

  const buttonStyle: CSSProperties = {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
  };

  const secondaryButtonStyle: CSSProperties = {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
  };

  const sectionHeaderStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
  };

  const sectionTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: "20px",
  };

  const hrStyle: CSSProperties = {
    margin: "28px 0",
    border: "none",
    borderTop: "1px solid #e5e7eb",
  };

  return (
    <div
      style={{
        maxWidth: "620px",
        margin: "0 auto",
        background: "#ffffff",
        padding: "28px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h1 style={{ marginTop: 0 }}>My Profile</h1>

      <p>
        <strong>Role:</strong> {user?.role}
      </p>

      {message && <p style={{ color: "#059669" }}>{message}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div style={{ marginTop: "24px" }}>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>Nickname</h3>

          {!editingNickname && (
            <button
              style={buttonStyle}
              onClick={() => {
                setNicknameDraft(nickname);
                setEditingNickname(true);
              }}
            >
              Change nickname
            </button>
          )}
        </div>

        {!editingNickname ? (
          <p>{nickname}</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            <input
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                style={buttonStyle}
                onClick={async () => {
                  await updateProfile({ nickname: nicknameDraft });
                  setEditingNickname(false);
                }}
              >
                Save
              </button>

              <button
                style={secondaryButtonStyle}
                onClick={() => {
                  setNicknameDraft(nickname);
                  setEditingNickname(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <hr style={hrStyle} />

      <div>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>Email</h3>

          {!editingEmail && (
            <button
              style={buttonStyle}
              onClick={() => {
                setEmailDraft(email);
                setEditingEmail(true);
              }}
            >
              Change email
            </button>
          )}
        </div>

        {!editingEmail ? (
          <p>{email}</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                style={buttonStyle}
                onClick={async () => {
                  await updateProfile({ email: emailDraft });
                  setEditingEmail(false);
                }}
              >
                Save
              </button>

              <button
                style={secondaryButtonStyle}
                onClick={() => {
                  setEmailDraft(email);
                  setEditingEmail(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <hr style={hrStyle} />

      <div>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>Password</h3>

          {!editingPassword && (
            <button
              style={buttonStyle}
              onClick={() => setEditingPassword(true)}
            >
              Change password
            </button>
          )}
        </div>

        {editingPassword && (
          <form
            onSubmit={handlePasswordSubmit}
            style={{ display: "grid", gap: "12px" }}
          >
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={buttonStyle}>
                Save password
              </button>

              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setEditingPassword(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}