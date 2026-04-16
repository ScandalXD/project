import { useAuth } from "../../hooks/useAuth";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      <h1 style={{ marginBottom: "12px" }}>CocktailApp</h1>
      <p style={{ fontSize: "18px", color: "#4b5563" }}>
        Prosta aplikacja do przeglądania, tworzenia i udostępniania przepisów na koktajle.
      </p>

      <div
        style={{
          marginTop: "24px",
          background: "#ffffff",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {isAuthenticated ? (
          <>
            <h2>Witaj, {user?.nickname} 👋</h2>
            <p>Jesteś zalogowany. Następnie podłączymy tu katalog, własne koktajle i profil.</p>
          </>
        ) : (
          <>
            <h2>Witaj w aplikacji</h2>
            <p>
              Możesz się zarejestrować, zalogować, przeglądać koktajle i korzystać z funkcji
              społecznościowych.
            </p>
          </>
        )}
      </div>
    </div>
  );
}