import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function VerifyAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifiziere...");
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("Fehlender Token.");
      return;
    }

    fetch(`${apiUrl}/verify.php?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.status=== "success") {
          setStatus("Erfolgreich verifiziert! Weiterleitung...");
          setTimeout(() => navigate("/"), 2000); // Weiterleitung nach 2s
        } else {
          setStatus(`Verifizierung fehlgeschlagen: ${data.message}`);
        }
      })
      .catch(() => {
        setStatus("Fehler bei der Verifizierung.");
      });
  }, [searchParams, navigate]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Account-Verifizierung</h1>
      <p>{status}</p>
    </div>
  );
}
