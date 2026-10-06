import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import QRCode from "qrcode";
import { loyaltyApi } from "./api";

export default function LoyaltyCodeDialog({
  card,
  purpose,
  token,
  onClose,
  onBooked,
}) {
  const [code, setCode] = useState(null),
    [qr, setQr] = useState(""),
    [error, setError] = useState(""),
    [seconds, setSeconds] = useState(120),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false,
      issuing = false,
      polling = false,
      current = null,
      ticks = 0;
    const issue = async () => {
      if (issuing || cancelled || document.hidden) return;
      issuing = true;
      try {
        const next = await loyaltyApi(token, "issue_code", {
          card_id: card.id,
          purpose,
        });
        const image = await QRCode.toDataURL(`iceapp-loyalty:${next.token}`, {
          width: 300,
          margin: 2,
        });
        if (!cancelled) {
          current = next;
          setCode(next);
          setQr(image);
          setError("");
          setSeconds(120);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          current = null;
          setCode(null);
          setQr("");
        }
      } finally {
        issuing = false;
      }
    };
    const status = async () => {
      if (polling || !current || cancelled || document.hidden) return;
      polling = true;
      try {
        const result = await loyaltyApi(token, "code_status", undefined, {
          code_id: current.id,
        });
        if (!cancelled) setError("");
        if (!cancelled && result.code.consumed_at) {
          cancelled = true;
          onBooked();
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        polling = false;
      }
    };
    issue();
    const timer = setInterval(async () => {
      if (cancelled || !current) return;
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(current.expires_at.replace(" ", "T")).getTime() -
            Date.now()) /
            1000,
        ),
      );
      setSeconds(remaining);
      if (++ticks % 5 === 0 || remaining === 0) await status();
      if (!cancelled && remaining === 0) await issue();
    }, 1000);
    const visible = () => {
      if (!document.hidden) {
        if (current) status();
        else issue();
      }
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [card.id, purpose, token, retry, onBooked]);
  return (
    <Dialog open onClose={onClose}>
      <DialogBackdrop className="loyalty-backdrop" />
      <div className="loyalty-dialog-wrap">
        <DialogPanel className="loyalty-dialog">
          <DialogTitle>
            {purpose === "stamp" ? "Stempel sammeln" : "Prämie einlösen"}
          </DialogTitle>
          <p>{card.shop_name}</p>
          <p className="loyalty-muted">
            {purpose === "stamp"
              ? "Zeige diesen Code dem Personal nach deinem Kauf."
              : `Das Personal bestätigt die Ausgabe: ${card.reward}`}
          </p>
          {qr && seconds > 0 ? (
            <>
              <img
                className="loyalty-qr"
                src={qr}
                alt="Einmalcode zum Scannen durch das Personal"
              />
              <span className="loyalty-manual-code" aria-label="Eingabecode">
                {code.manual_code.slice(0, 5)} {code.manual_code.slice(5)}
              </span>
              <p>Gültig für {seconds} Sekunden · wird automatisch erneuert</p>
            </>
          ) : (
            <p role="status">
              {error ? "Code nicht verfügbar." : "Code wird erstellt …"}
            </p>
          )}
          {error && (
            <p role="alert" className="loyalty-error">
              {error}
            </p>
          )}
          <div className="loyalty-actions">
            {error && (
              <button onClick={() => setRetry((value) => value + 1)}>
                Erneut versuchen
              </button>
            )}
            <button onClick={onClose}>Schließen</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
