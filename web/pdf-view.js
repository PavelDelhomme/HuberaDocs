/** Aperçu PDF dans la page (PDF.js) — jamais d’onglet ni de téléchargement. */

let gen = 0;
let blobUrl = '';

function revoke() {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = '';
  }
}

export function clearPdfStage(stage) {
  gen += 1;
  revoke();
  if (stage) stage.replaceChildren();
}

export async function renderPdfBytes(stage, bytes) {
  const my = ++gen;
  revoke();
  stage.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'lead';
  loading.textContent = 'Chargement du PDF…';
  stage.appendChild(loading);

  const pdfjs = await import('/vendor/pdfjs/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.mjs';
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  if (my !== gen) return;

  loading.remove();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const wrapW = Math.max(280, stage.clientWidth || 720);

  for (let n = 1; n <= pdf.numPages; n += 1) {
    if (my !== gen) return;
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1.85, wrapW / base.width);
    const viewport = page.getViewport({ scale: scale * dpr });
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page';
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
    canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
    canvas.setAttribute('aria-label', `Page ${n} / ${pdf.numPages}`);
    stage.appendChild(canvas);
    await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport }).promise;
  }
}

export function renderHtmlBlob(stage, htmlBytes) {
  revoke();
  const blob = new Blob([htmlBytes], { type: 'text/html;charset=utf-8' });
  blobUrl = URL.createObjectURL(blob);
  stage.replaceChildren();
  const frame = document.createElement('iframe');
  frame.className = 'pdf html-preview';
  frame.title = 'Aperçu HTML';
  frame.src = blobUrl;
  stage.appendChild(frame);
}
