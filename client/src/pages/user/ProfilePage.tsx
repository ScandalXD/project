import {  useEffect, useState, type SyntheticEvent } from "react";
import { profileApi } from "../../api/profileApi";
import { useAuth } from "../../hooks/useAuth";
import type { UpdateProfileRequest } from "../../types/user";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function ProfilePage() {
  const { user, setAuthData, logout } = useAuth();

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

  const handlePasswordSubmit = async (
    e: SyntheticEvent<HTMLFormElement>
  ) => {
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

  return (
    <div
      className="page-container"
      style={{
        maxWidth: "700px",
      }}
    >
      <div
        className="card"
        style={{
          padding: "28px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>My Profile</h1>

        {(message || error) && (
          <div style={{ marginBottom: "20px" }}>
            {message && (
              <p className="success-text" style={{ margin: 0 }}>
                {message}
              </p>
            )}

            {error && (
              <p className="error-text" style={{ margin: 0 }}>
                {error}
              </p>
            )}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: "24px",
          }}
        >
          <section>
            <div className="section-header">
              <div>
                <h3 style={{ margin: 0 }}>Nickname</h3>

                {!editingNickname && (
                  <p className="muted-text" style={{ margin: "4px 0 0" }}>
                    {nickname}
                  </p>
                )}
              </div>

              {!editingNickname && (
                <Button
                  variant="secondary"
                  onClick={() => setEditingNickname(true)}
                >
                  Change
                </Button>
              )}
            </div>

            {editingNickname && (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <Input
                  value={nicknameDraft}
                  onChange={(e) => setNicknameDraft(e.target.value)}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <Button
                    onClick={() => {
                      updateProfile({
                        nickname: nicknameDraft,
                      });

                      setEditingNickname(false);
                    }}
                  >
                    Save
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      setNicknameDraft(nickname);
                      setEditingNickname(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="section-header">
              <div>
                <h3 style={{ margin: 0 }}>Email</h3>

                {!editingEmail && (
                  <p className="muted-text" style={{ margin: "4px 0 0" }}>
                    {email}
                  </p>
                )}
              </div>

              {!editingEmail && (
                <Button
                  variant="secondary"
                  onClick={() => setEditingEmail(true)}
                >
                  Change
                </Button>
              )}
            </div>

            {editingEmail && (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <Input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <Button
                    onClick={() => {
                      updateProfile({
                        email: emailDraft,
                      });

                      setEditingEmail(false);
                    }}
                  >
                    Save
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEmailDraft(email);
                      setEditingEmail(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="section-header">
              <div>
                <h3 style={{ margin: 0 }}>Password</h3>

                {!editingPassword && (
                  <p className="muted-text" style={{ margin: "4px 0 0" }}>
                    ••••••••
                  </p>
                )}
              </div>

              {!editingPassword && (
                <Button
                  variant="secondary"
                  onClick={() => setEditingPassword(true)}
                >
                  Change
                </Button>
              )}
            </div>

            {editingPassword && (
              <form
                onSubmit={handlePasswordSubmit}
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <Button type="submit">Save</Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingPassword(false);

                      setCurrentPassword("");
                      setNewPassword("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </section>

          {user?.role !== "superadmin" && (
            <section>
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--color-border)",
                  marginBottom: "24px",
                }}
              />

              <h3 style={{ color: "var(--color-danger)" }}>
                Danger Zone
              </h3>

              <Button
                variant="danger"
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Are you sure you want to delete your account?"
                  );

                  if (!confirmed) return;

                  try {
                    await profileApi.deleteProfile();

                    logout();

                    window.location.href = "/login";
                  } catch {
                    setError("Failed to delete account.");
                  }
                }}
              >
                Delete Account
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}