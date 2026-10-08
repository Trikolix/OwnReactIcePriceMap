import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { shopAssetUrl, shopDate } from "../../utils/shopDetail";

export default function ShopDetailPhotoDialog({
  photos,
  index,
  onIndexChange,
  onClose,
}) {
  const [failed, setFailed] = useState(false),
    photo = photos[index];
  useEffect(() => {
    setFailed(false);
  }, [photo?.url]);
  useEffect(() => {
    const keys = (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        onIndexChange(
          (index + (event.key === "ArrowLeft" ? -1 : 1) + photos.length) %
            photos.length,
        );
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [index, photos.length, onIndexChange]);
  if (!photo) return null;
  return (
    <Dialog open onClose={onClose} className="shopdetail-photo-dialog">
      <DialogBackdrop className="shopdetail-photo-backdrop" />
      <div className="shopdetail-photo-position">
        <DialogPanel className="shopdetail-photo-panel">
          <header>
            <DialogTitle>
              Foto von {photo.username || "der Community"}
            </DialogTitle>
            <button
              className="shopdetail-photo-button"
              onClick={onClose}
              aria-label="Fotoansicht schließen"
            >
              <X size={24} />
            </button>
          </header>
          <div className="shopdetail-photo-stage">
            {shopAssetUrl(photo.url) && !failed ? (
              <img
                src={shopAssetUrl(photo.url)}
                alt={
                  photo.beschreibung ||
                  `Foto von ${photo.username || "der Community"}`
                }
                onError={() => setFailed(true)}
              />
            ) : (
              <p role="status">
                <Images size={32} /> Dieses Foto konnte nicht geladen werden.
              </p>
            )}
          </div>
          <footer>
            {photos.length > 1 && (
              <button
                className="shopdetail-photo-button"
                onClick={() =>
                  onIndexChange((index - 1 + photos.length) % photos.length)
                }
                aria-label="Vorheriges Foto"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <p aria-live="polite">
              {index + 1} / {photos.length}
              <span>{shopDate(photo.datum, true)}</span>
            </p>
            {photos.length > 1 && (
              <button
                className="shopdetail-photo-button"
                onClick={() => onIndexChange((index + 1) % photos.length)}
                aria-label="Nächstes Foto"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
