// DOM overlay for the portrait upload + crop step. Everything here is local: the file is read with
// FileReader, drawn to an offscreen canvas, and never sent anywhere. Returns the stylized face
// texture (already run through face/process.ts) ready to register as a Phaser texture.
import { makeRGBA, skinCentroid, buildFaceTexture, FACE_TEXTURE_SIZE, type RGBAImage } from './process';

export interface CropperResult { rgba: RGBAImage; dataUrl: string }

function imageToRGBA(img: HTMLImageElement, maxSize = 640): RGBAImage {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  return { width: w, height: h, data: id.data as unknown as Uint8ClampedArray };
}

export function openFaceCropper(skin: [number, number, number], outline: [number, number, number]): Promise<CropperResult | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,7,17,.88);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:monospace;color:#f3f4e8;';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:#0b1730;border:2px solid #344861;border-radius:10px;padding:18px;width:min(92vw,380px);text-align:center;';
    panel.innerHTML = `
      <div style="font-size:14px;color:#ffcf5c;margin-bottom:10px;letter-spacing:.06em;">SET FACE</div>
      <input type="file" accept="image/*" id="nepho-face-file" style="color:#9bb1c9;font-size:12px;margin-bottom:10px;" />
      <div id="nepho-face-stage" style="position:relative;width:280px;height:280px;margin:8px auto;background:#14243d;border-radius:8px;overflow:hidden;touch-action:none;display:none;">
        <canvas id="nepho-face-canvas" width="280" height="280" style="position:absolute;inset:0;cursor:grab;"></canvas>
        <svg width="280" height="280" style="position:absolute;inset:0;pointer-events:none;">
          <defs><mask id="nepho-face-mask"><rect width="280" height="280" fill="white"/><circle cx="140" cy="140" r="110" fill="black"/></mask></defs>
          <rect width="280" height="280" fill="rgba(5,7,17,.55)" mask="url(#nepho-face-mask)"/>
          <circle cx="140" cy="140" r="110" fill="none" stroke="#75f5dc" stroke-width="2" stroke-dasharray="6 5"/>
        </svg>
      </div>
      <div id="nepho-face-hint" style="font-size:11px;color:#9bb1c9;margin:6px 0;display:none;">drag to pan · wheel / pinch to zoom</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
        <button id="nepho-face-cancel" style="background:#14243d;border:1px solid #344861;color:#f3f4e8;padding:8px 14px;border-radius:6px;font-family:monospace;">CANCEL</button>
        <button id="nepho-face-ok" style="background:#75f5dc;border:none;color:#0b1730;padding:8px 14px;border-radius:6px;font-family:monospace;font-weight:bold;display:none;">USE PHOTO</button>
      </div>`;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const fileInput = panel.querySelector('#nepho-face-file') as HTMLInputElement;
    const stage = panel.querySelector('#nepho-face-stage') as HTMLDivElement;
    const hint = panel.querySelector('#nepho-face-hint') as HTMLDivElement;
    const canvas = panel.querySelector('#nepho-face-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const okBtn = panel.querySelector('#nepho-face-ok') as HTMLButtonElement;
    const cancelBtn = panel.querySelector('#nepho-face-cancel') as HTMLButtonElement;

    let src: RGBAImage | null = null;
    let srcCanvas: HTMLCanvasElement | null = null;
    let zoom = 1, panX = 0, panY = 0, baseScale = 1;
    let dragging = false, dragStart = { x: 0, y: 0 }, panStart = { x: 0, y: 0 };

    function draw() {
      if (!srcCanvas) return;
      ctx.clearRect(0, 0, 280, 280);
      const s = baseScale * zoom;
      const w = srcCanvas.width * s, h = srcCanvas.height * s;
      ctx.drawImage(srcCanvas, 140 - w / 2 + panX, 140 - h / 2 + panY, w, h);
    }
    function close(result: CropperResult | null) { document.body.removeChild(overlay); resolve(result); }

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          src = imageToRGBA(img);
          srcCanvas = document.createElement('canvas'); srcCanvas.width = src.width; srcCanvas.height = src.height;
          srcCanvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(src.data), src.width, src.height), 0, 0);
          baseScale = Math.max(280 / src.width, 280 / src.height);
          zoom = 1; panX = 0; panY = 0;
          const centroid = skinCentroid(src);
          if (centroid) {
            // pre-center the detected face under the fixed oval guide at (140,140), radius 110
            const s = baseScale;
            panX = (src.width / 2 - centroid.x) * s;
            panY = (src.height / 2 - centroid.y) * s;
            zoom = Math.max(1, Math.min(2.4, 110 / (centroid.r * s)));
          }
          stage.style.display = 'block'; hint.style.display = 'block'; okBtn.style.display = 'inline-block';
          draw();
        };
        img.onerror = () => alert('Could not read that image.');
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

    canvas.addEventListener('pointerdown', (e) => { dragging = true; dragStart = { x: e.clientX, y: e.clientY }; panStart = { x: panX, y: panY }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('pointermove', (e) => { if (!dragging) return; panX = panStart.x + (e.clientX - dragStart.x); panY = panStart.y + (e.clientY - dragStart.y); draw(); });
    canvas.addEventListener('pointerup', () => { dragging = false; canvas.style.cursor = 'grab'; });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(0.5, Math.min(4, zoom * (e.deltaY > 0 ? 0.92 : 1.08))); draw(); }, { passive: false });
    let pinchDist = 0;
    canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (pinchDist > 0) zoom = Math.max(0.5, Math.min(4, zoom * (d / pinchDist)));
        pinchDist = d; draw();
      }
    }, { passive: true });

    cancelBtn.addEventListener('click', () => close(null));
    okBtn.addEventListener('click', () => {
      if (!src) return;
      const s = baseScale * zoom;
      // invert the on-canvas transform to find the source-space circle center/radius under the fixed guide
      const cx = src.width / 2 - panX / s;
      const cy = src.height / 2 - panY / s;
      const r = 110 / s;
      const styl = buildFaceTexture(src, cx, cy, r, skin, outline, { outputSize: FACE_TEXTURE_SIZE });
      const out = document.createElement('canvas'); out.width = styl.width; out.height = styl.height;
      out.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(styl.data), styl.width, styl.height), 0, 0);
      close({ rgba: styl, dataUrl: out.toDataURL('image/png') });
    });
  });
}

export function blankFaceTexture(): RGBAImage { return makeRGBA(1, 1); }
