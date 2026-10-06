import React from "react";
import { Link } from "react-router-dom";
import Header from "../../Header";
import { useUser } from "../../context/UserContext";
import "./loyalty.css";

export function LoginRequired() {
  return (
    <section className="loyalty-panel">
      <h2>Bitte einloggen</h2>
      <p>
        Deine Kundenkarten und Betreiberrechte sind mit deinem Nutzerkonto
        verbunden.
      </p>
      <button
        className="loyalty-primary"
        onClick={() => window.dispatchEvent(new CustomEvent("auth:open-login"))}
      >
        Einloggen
      </button>
    </section>
  );
}
export default function LoyaltyLayout({ title, intro, children }) {
  const { isLoggedIn, authReady } = useUser();
  return (
    <>
      <Header />
      <main className="loyalty-page">
        <nav className="loyalty-nav" aria-label="Kundenkarten und Eisdielen">
          <Link to="/kundenkarten">Meine Kundenkarten</Link>
          <Link to="/betreiber">Meine Eisdielen</Link>
        </nav>
        <h1>{title}</h1>
        {intro && <p className="loyalty-intro">{intro}</p>}
        {!authReady ? (
          <p role="status">Wird geladen …</p>
        ) : !isLoggedIn ? (
          <LoginRequired />
        ) : (
          children
        )}
      </main>
    </>
  );
}
export function Feedback({ error, message }) {
  return (
    <>
      {error && (
        <p className="loyalty-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="loyalty-success" role="status">
          {message}
        </p>
      )}
    </>
  );
}
