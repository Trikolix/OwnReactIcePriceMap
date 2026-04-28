// Gemeinsame Konfiguration fuer Bild-Uploads
export const MAX_IMAGES = 5;
export const MAX_DIMENSION = 1600; // px
export const JPEG_QUALITY = 0.8;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const getCompressedFileName = (name) => {
    const baseName = name.replace(/\.[^.]+$/, '') || 'bild';
    return `${baseName}.jpg`;
};

const canvasToBlob = (canvas, quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Canvas toBlob failed'));
        else resolve(blob);
    }, 'image/jpeg', quality);
});

// Komprimiere ein Image-File mittels Canvas und gib ein JPEG-File zurueck.
export const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type?.startsWith('image/')) {
            reject(new Error('Bitte nur Bilddateien auswaehlen.'));
            return;
        }

        if (file.type === 'image/gif') {
            reject(new Error('GIF-Dateien werden nicht unterstuetzt.'));
            return;
        }

        let objectUrl = null;
        try {
            const img = new Image();
            img.onload = async () => {
                try {
                    if (objectUrl) URL.revokeObjectURL(objectUrl);

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
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    let quality = JPEG_QUALITY;
                    let blob = await canvasToBlob(canvas, quality);

                    while (blob.size > MAX_UPLOAD_BYTES && quality > 0.55) {
                        quality -= 0.1;
                        blob = await canvasToBlob(canvas, quality);
                    }

                    while (blob.size > MAX_UPLOAD_BYTES && canvas.width > 900 && canvas.height > 900) {
                        const nextWidth = Math.round(canvas.width * 0.85);
                        const nextHeight = Math.round(canvas.height * 0.85);
                        const smallerCanvas = document.createElement('canvas');
                        smallerCanvas.width = nextWidth;
                        smallerCanvas.height = nextHeight;
                        const smallerCtx = smallerCanvas.getContext('2d');
                        smallerCtx.fillStyle = '#ffffff';
                        smallerCtx.fillRect(0, 0, nextWidth, nextHeight);
                        smallerCtx.drawImage(canvas, 0, 0, nextWidth, nextHeight);
                        canvas.width = nextWidth;
                        canvas.height = nextHeight;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, nextWidth, nextHeight);
                        ctx.drawImage(smallerCanvas, 0, 0);
                        blob = await canvasToBlob(canvas, 0.65);
                    }

                    const compressedFile = new File([blob], getCompressedFileName(file.name), {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                reject(new Error('Bild konnte nicht gelesen werden.'));
            };
            objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
        } catch (e) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(e);
        }
    });
};

// Einfache Mobile-Device-Erkennung; nicht perfekt, aber ausreichend.
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
    MAX_UPLOAD_BYTES,
    compressImageFile,
    isMobileDevice,
};

export default imageUtils;
