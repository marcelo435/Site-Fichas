export interface Resultado {
  total: number;
  detalhe: string;
}

const TERMO = /(\d*d\d+(?:k[hl]\d*)?|\d+)/;

/**
 * Rola expressões como "1d20+3", "2d6+1d4-1", "3d20".
 * "3d20kh1" = rola 3d20 e fica com o maior; "2d20kl1" = fica com o menor.
 * Retorna null se a expressão for inválida.
 */
export function rolarDados(expr: string): Resultado | null {
  const limpo = expr
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/\+-/g, '-')
    .replace(/-\+/g, '-')
    .replace(/--/g, '+');
  const valida = new RegExp(`^[+-]?${TERMO.source}([+-]${TERMO.source})*$`);
  if (!valida.test(limpo)) return null;

  let total = 0;
  const partes: string[] = [];
  for (const [, sinal, termo] of limpo.matchAll(new RegExp(`([+-]?)${TERMO.source}`, 'g'))) {
    const s = sinal === '-' ? -1 : 1;
    const m = termo.match(/^(\d*)d(\d+)(?:k([hl])(\d*))?$/);
    if (m) {
      const q = Math.min(Number(m[1]) || 1, 100);
      const faces = Number(m[2]);
      if (faces < 1) return null;
      const rs = Array.from({ length: q }, () => 1 + Math.floor(Math.random() * faces));
      let usados = rs;
      if (m[3]) {
        const k = Math.max(1, Math.min(q, Number(m[4]) || 1));
        usados = [...rs].sort((a, b) => (m[3] === 'h' ? b - a : a - b)).slice(0, k);
      }
      total += s * usados.reduce((a, b) => a + b, 0);
      const ficou = m[3] ? ` → ${usados.join(', ')}` : '';
      partes.push(`${sinal}${q}d${faces}${m[3] ? `k${m[3]}${m[4] || 1}` : ''}[${rs.join(', ')}${ficou}]`);
    } else {
      total += s * Number(termo);
      partes.push(`${sinal}${termo}`);
    }
  }
  return { total, detalhe: partes.join(' ') };
}
