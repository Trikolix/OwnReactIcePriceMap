// Gemeinsame Konfiguration für Bild-Uploads
export const MAX_IMAGES = 5;
export const MAX_DIMENSION = 1600; // px
export const JPEG_QUALITY = 0.8;

// Komprimiere ein Image-File mittels Canvas (falls möglich) und gib neues File zurück
export const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = width / height;
                    if (ratio > 1) {
                        width = MAX_DIMENSION;
                        height = Math.round(MAX_DIMENSION / ratio);
                    } else {
                        height = MAX_DIMENSION;
                        width = Math.round(MAX_DIMENSION * ratio);
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error('Canvas toBlob failed'));
                    const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                    resolve(compressedFile);
                }, 'image/jpeg', JPEG_QUALITY);
            };
            img.onerror = (e) => reject(e);
            img.src = URL.createObjectURL(file);
        } catch (e) {
            reject(e);
        }
    });
};

// Einfache Mobile-Device-Erkennung; nicht perfekt, aber ausreichend
export const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return true;
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) return true;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    return false;
};

const imageUtils = {
    MAX_IMAGES,
    MAX_DIMENSION,
    JPEG_QUALITY,
    compressImageFile,
    isMobileDevice,
};

export default imageUtils;
