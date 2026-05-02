import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nickname: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register(form);
      navigate("/catalog");
    } catch {
      setError("Nie udało się utworzyć konta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "40px auto",
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>Register</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
        <input
          type="text"
          name="nickname"
          placeholder="Nickname"
          value={form.nickname}
          onChange={handleChange}
          required
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db" }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db" }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db" }}
        />

        {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            border: "none",
            background: "#111827",
            color: "#ffffff",
            padding: "12px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: "16px" }}>
        Masz już konto? <Link to="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}