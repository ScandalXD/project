import { useEffect, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { LogOut } from "lucide-react";
import { profileApi } from "../../api/profileApi";
import { useAuth } from "../../hooks/useAuth";
import type { UpdateProfileRequest } from "../../types/user";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { ConfirmModal } from "../../components/ui/Modal";
import UserAvatar from "../../components/ui/UserAvatar";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export default function ProfilePage() {
  const { user, token, setAuthData, logout } = useAuth();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  const [nicknameDraft, setNicknameDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editingNickname, setEditingNickname] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileApi.getProfile();

        setNickname(data.nickname);
        setEmail(data.email);
        setAvatar(data.avatar ?? null);
        setNicknameDraft(data.nickname);
        setEmailDraft(data.email);
      } catch {
        setError("Failed to load profile.");
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

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
      setAvatar(response.user.avatar ?? null);
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

  const handleDeleteProfile = async () => {
    try {
      await profileApi.deleteProfile();

      logout();
      window.location.href = "/login";
    } catch {
      setError("Failed to delete account.");
      setIsDeleteModalOpen(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setMessage("");
    setError("");

    if (!selectedFile) {
      setAvatarFile(null);
      return;
    }

    if (!AVATAR_TYPES.has(selectedFile.type)) {
      setAvatarFile(null);
      event.target.value = "";
      setError("Avatar must be a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (selectedFile.size > MAX_AVATAR_SIZE) {
      setAvatarFile(null);
      event.target.value = "";
      setError("Avatar image must be 5 MB or smaller.");
      return;
    }

    setAvatarFile(selectedFile);
  };

  const handleAvatarSubmit = async () => {
    if (!avatarFile) return;

    setMessage("");
    setError("");

    try {
      const response = await profileApi.updateAvatar(avatarFile);

      if (token) {
        setAuthData(token, response.user);
      }

      setAvatar(response.user.avatar ?? null);
      setAvatarFile(null);
      setMessage("Avatar updated successfully.");
    } catch {
      setError("Failed to update avatar.");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="page-container profile-page">
      <div className="card profile-card">
        <h1 className="profile-title">My Profile</h1>

        {(message || error) && (
          <div className="profile-message-box">
            {message && <p className="success-text profile-message">{message}</p>}
            {error && <p className="error-text profile-message">{error}</p>}
          </div>
        )}

        <div className="profile-sections">
          <section className="profile-section profile-avatar-section">
            <UserAvatar
              nickname={nickname || user?.nickname}
              avatar={avatarPreview || avatar}
              className="profile-avatar"
            />

            <div className="profile-avatar-main">
              <h3 className="profile-section-title">Avatar</h3>
              <p className="muted-text profile-section-value">
                Upload a JPG, PNG, WebP, or GIF image.
              </p>
              <div className="profile-avatar-actions">
                <label className="app-button app-button-secondary profile-avatar-file">
                  Choose image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                  />
                </label>

                <Button
                  type="button"
                  onClick={handleAvatarSubmit}
                  disabled={!avatarFile}
                >
                  Save avatar
                </Button>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-header">
              <div>
                <h3 className="profile-section-title">Nickname</h3>

                {!editingNickname && (
                  <p className="muted-text profile-section-value">{nickname}</p>
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
              <div className="profile-edit-box">
                <Input
                  value={nicknameDraft}
                  onChange={(e) => setNicknameDraft(e.target.value)}
                />

                <div className="profile-actions">
                  <Button
                    onClick={() => {
                      updateProfile({ nickname: nicknameDraft });
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

          <section className="profile-section">
            <div className="section-header">
              <div>
                <h3 className="profile-section-title">Email</h3>

                {!editingEmail && (
                  <p className="muted-text profile-section-value">{email}</p>
                )}
              </div>

              {!editingEmail && (
                <Button variant="secondary" onClick={() => setEditingEmail(true)}>
                  Change
                </Button>
              )}
            </div>

            {editingEmail && (
              <div className="profile-edit-box">
                <Input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                />

                <div className="profile-actions">
                  <Button
                    onClick={() => {
                      updateProfile({ email: emailDraft });
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

          <section className="profile-section">
            <div className="section-header">
              <div>
                <h3 className="profile-section-title">Password</h3>

                {!editingPassword && (
                  <p className="muted-text profile-section-value">••••••••</p>
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
              <form onSubmit={handlePasswordSubmit} className="profile-edit-box">
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

                <div className="profile-actions">
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

          <section className="profile-section profile-account-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleLogout}
            >
              <span className="profile-action-icon">
                <LogOut size={17} aria-hidden="true" />
              </span>
              Logout
            </Button>
          </section>

          {user?.role !== "superadmin" && (
            <section className="profile-section profile-danger-zone">
              <h3 className="profile-danger-title">Danger Zone</h3>

              <Button
                variant="danger"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </section>
          )}
        </div>
      </div>

      {isDeleteModalOpen && (
        <ConfirmModal
          title="Delete account"
          text="Are you sure you want to delete your account? This action cannot be undone."
          confirmText="Delete account"
          cancelText="Cancel"
          danger
          onConfirm={handleDeleteProfile}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
