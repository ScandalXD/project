import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <h1>404</h1>
      <p>Strona nie została znaleziona.</p>
      <Link to="/">Wróć na stronę główną</Link>
    </div>
  );
}