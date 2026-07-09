/**
 * Divide il testo in blocchi di circa `targetSize` caratteri spezzando su
 * confini di paragrafo (e di frase per paragrafi enormi), così ogni blocco
 * resta sotto il limite accettato dalla Edge Function (24k chars).
 */
export function chunkText(text: string, targetSize = 20_000): string[] {
  const clean = text.trim();
  if (clean.length <= targetSize) {
    return clean ? [clean] : [];
  }

  const chunks: string[] = [];
  let current = '';

  const pushOversized = () => {
    while (current.length > targetSize) {
      const slice = current.slice(0, targetSize);
      const cut = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'));
      const idx = cut > targetSize * 0.5 ? cut + 1 : targetSize;
      chunks.push(current.slice(0, idx).trim());
      current = current.slice(idx).trim();
    }
  };

  for (const paragraph of clean.split(/\n+/)) {
    if (current && current.length + paragraph.length + 1 > targetSize) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n${paragraph}` : paragraph;
    }
    pushOversized();
  }
  if (current) {
    chunks.push(current);
  }

  // La Edge Function rifiuta testi sotto i 40 caratteri.
  return chunks.filter((chunk) => chunk.length >= 40);
}

/**
 * Distribuisce `total` card sui blocchi.
 * - Più blocchi che card: 1 card a blocchi campionati uniformemente lungo il documento.
 * - Altrimenti: almeno 1 a testa, il resto proporzionale alla lunghezza del blocco.
 */
export function allocateCounts(lengths: number[], total: number): number[] {
  const n = lengths.length;
  const counts = new Array<number>(n).fill(0);
  if (n === 0 || total <= 0) {
    return counts;
  }

  if (n >= total) {
    for (let i = 0; i < total; i++) {
      counts[Math.floor(((i + 0.5) * n) / total)] = 1;
    }
    return counts;
  }

  counts.fill(1);
  const extra = total - n;
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  const quotas = lengths.map((length) => (extra * length) / totalLength);
  let assigned = n;
  quotas.forEach((quota, i) => {
    const floor = Math.floor(quota);
    counts[i] += floor;
    assigned += floor;
  });

  const byRemainder = quotas
    .map((quota, i) => ({ i, remainder: quota - Math.floor(quota) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let k = 0; assigned < total; k++, assigned++) {
    counts[byRemainder[k].i] += 1;
  }
  return counts;
}
