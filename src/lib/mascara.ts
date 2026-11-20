/**
 * Transforma a imagem de um símbolo (traço escuro em fundo claro, traço claro em fundo
 * escuro, etc.) numa "máscara": PNG branco com transparência, recortado e centralizado.
 * Assim o site pode pintar o símbolo com a cor do elemento e fazer ele brilhar.
 */
export interface OpcoesMascara {
  /**
   * 'transparencia' = a imagem já tem fundo transparente (usa o canal alfa);
   * 'escuro' = o desenho é mais escuro que o fundo; 'claro' = mais claro;
   * 'auto' = descobre sozinho olhando a borda.
   */
  modo?: 'transparencia' | 'escuro' | 'claro' | 'auto';
  /** valor (0–1, luminância ou alfa) onde o pixel começa a aparecer e onde fica totalmente opaco */
  de?: number;
  ate?: number;
  /** tira manchas grandes encostadas na borda da imagem (ex.: fundo escuro em volta de um desenho escuro) */
  limparBorda?: boolean;
  /** tamanho final do PNG (quadrado) */
  tamanho?: number;
}

const suave = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function gerarMascara(img: CanvasImageSource & { width: number; height: number }, o: OpcoesMascara = {}): string {
  const max = 900;
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * k);
  const h = Math.round(img.height * k);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, w, h);
  const dados = g.getImageData(0, 0, w, h);
  const px = dados.data;
  const lum = new Float32Array(w * h);
  const opac = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    opac[i] = px[i * 4 + 3] / 255;
    const a = px[i * 4 + 3] / 255;
    // pixel transparente conta como fundo
    const l = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
    lum[i] = a < 0.05 ? NaN : l;
  }

  // fundo = mediana da borda
  const borda: number[] = [];
  for (let x = 0; x < w; x++) borda.push(lum[x], lum[(h - 1) * w + x]);
  for (let y = 0; y < h; y++) borda.push(lum[y * w], lum[y * w + w - 1]);
  const validos = borda.filter(v => !Number.isNaN(v)).sort((a, b) => a - b);
  const fundo = validos.length ? validos[Math.floor(validos.length / 2)] : 0.5;
  // borda quase toda transparente: a imagem já vem recortada
  const bordaTransparente = validos.length < borda.length * 0.4;
  const modo = o.modo && o.modo !== 'auto' ? o.modo : bordaTransparente ? 'transparencia' : fundo > 0.5 ? 'escuro' : 'claro';
  const alfa = new Float32Array(w * h);
  if (modo === 'transparencia') {
    // sombras semitransparentes "assadas" na imagem ficam de fora
    const de = o.de ?? 0.55;
    const ate = o.ate ?? 0.9;
    for (let i = 0; i < w * h; i++) alfa[i] = suave(de, ate, opac[i]);
  } else {
    const de = o.de ?? (modo === 'escuro' ? fundo - 0.1 : fundo + 0.1);
    const ate = o.ate ?? (modo === 'escuro' ? fundo - 0.45 : fundo + 0.45);
    for (let i = 0; i < w * h; i++) alfa[i] = Number.isNaN(lum[i]) ? 0 : suave(de, ate, lum[i]) * opac[i];
  }

  if (o.limparBorda) {
    // apaga o que estiver ligado à borda (inundação a partir das bordas)
    const fila: number[] = [];
    const visto = new Uint8Array(w * h);
    const empurrar = (i: number) => { if (!visto[i] && alfa[i] > 0.15) { visto[i] = 1; fila.push(i); } };
    for (let x = 0; x < w; x++) { empurrar(x); empurrar((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { empurrar(y * w); empurrar(y * w + w - 1); }
    while (fila.length) {
      const i = fila.pop()!;
      alfa[i] = 0;
      const x = i % w;
      if (x > 0) empurrar(i - 1);
      if (x < w - 1) empurrar(i + 1);
      if (i >= w) empurrar(i - w);
      if (i < w * (h - 1)) empurrar(i + w);
    }
  }

  // recorte no desenho
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alfa[y * w + x] > 0.08) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }

  for (let i = 0; i < w * h; i++) {
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 255;
    px[i * 4 + 3] = Math.round(alfa[i] * 255);
  }
  g.putImageData(dados, 0, 0);

  const tam = o.tamanho ?? 320;
  const saida = document.createElement('canvas');
  saida.width = saida.height = tam;
  const lado = Math.max(x1 - x0 + 1, y1 - y0 + 1);
  const escala = (tam * 0.94) / lado;
  const dw = (x1 - x0 + 1) * escala;
  const dh = (y1 - y0 + 1) * escala;
  saida.getContext('2d')!.drawImage(cv, x0, y0, x1 - x0 + 1, y1 - y0 + 1, (tam - dw) / 2, (tam - dh) / 2, dw, dh);
  return saida.toDataURL('image/png');
}

/** Lê um arquivo de imagem e devolve a máscara. */
export function mascaraDeArquivo(arq: File, o?: OpcoesMascara): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(arq);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        res(gerarMascara(img, o));
      } catch (e) {
        rej(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error('Imagem inválida'));
    };
    img.src = url;
  });
}
