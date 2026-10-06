import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

export default function LoyaltyScanner({ onCode, onClose }) {
  const video = useRef(null),
    [error, setError] = useState("");
  useEffect(() => {
    let stopped = false,
      stream,
      controls,
      timer,
      scanning = false;
    const stop = () => {
      clearInterval(timer);
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
    const found = (raw) => {
      if (stopped) return;
      stopped = true;
      stop();
      onCode(raw);
    };
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Die Kamera ist hier nicht verfügbar. Bitte den Eingabecode verwenden.",
          );
        const formats = window.BarcodeDetector
          ? await window.BarcodeDetector.getSupportedFormats()
          : [];
        if (formats.includes("qr_code")) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
          if (stopped) {
            stop();
            return;
          }
          video.current.srcObject = stream;
          await video.current.play();
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          timer = setInterval(async () => {
            if (stopped || scanning || video.current?.readyState < 2) return;
            scanning = true;
            try {
              const codes = await detector.detect(video.current);
              if (codes[0]) found(codes[0].rawValue);
            } catch {
              /* Keep scanning frames; manual entry remains available. */
            } finally {
              scanning = false;
            }
          }, 350);
        } else {
          const { BrowserQRCodeReader } = await import("@zxing/browser");
          if (stopped) return;
          controls = await new BrowserQRCodeReader().decodeFromConstraints(
            { video: { facingMode: { ideal: "environment" } }, audio: false },
            video.current,
            (result, _error, activeControls) => {
              if (result) {
                activeControls.stop();
                found(result.getText());
              }
            },
          );
          if (stopped) controls.stop();
        }
      } catch (err) {
        stop();
        if (!stopped)
          setError(
            err.name === "NotAllowedError"
              ? "Kamerazugriff wurde abgelehnt. Bitte den Eingabecode verwenden."
              : err.message ||
                  "Kamera konnte nicht gestartet werden. Bitte den Eingabecode verwenden.",
          );
      }
    })();
    return () => {
      stopped = true;
      stop();
    };
  }, [onCode]);
  return (
    <Dialog open onClose={onClose}>
      <DialogBackdrop className="loyalty-backdrop" />
      <div className="loyalty-dialog-wrap">
        <DialogPanel className="loyalty-dialog">
          <DialogTitle>Kundenkarte scannen</DialogTitle>
          <p>Code mittig vor die Kamera halten.</p>
          <video
            className="loyalty-video"
            ref={video}
            muted
            playsInline
            autoPlay
            aria-label="Kameravorschau"
          />
          {error && (
            <p role="alert" className="loyalty-error">
              {error}
            </p>
          )}
          <button onClick={onClose}>Eingabecode verwenden / Schließen</button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
