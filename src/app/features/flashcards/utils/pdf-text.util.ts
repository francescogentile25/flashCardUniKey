import * as pdfjs from 'pdfjs-dist';

// Il builder Angular (esbuild) non risolve `new URL(..., import.meta.url)`:
// il worker viene copiato in root output via `assets` in angular.json.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', document.baseURI).toString();

/** Estrae il testo da un PDF interamente lato client (nessun upload al server). */
export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}
