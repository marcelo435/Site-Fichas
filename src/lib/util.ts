export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const porcentagem = (atual: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;

export const iniciais = (nome: string) =>
  (nome || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

export const nomeArquivo = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '') || 'arquivo';

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Recursos que só fazem sentido para personagem (monstro não tem Sede nem Fome). */
export const recursoSoDePersonagem = (nome: string) => /sede|fome|agua|comida/.test(semAcento(nome));

export const CORES = ['#c2413b', '#8a8a8a', '#c9a227', '#7c4dff', '#2bb3a3', '#d46a2b', '#3b6fd4', '#c24d9b'];

export function corElemento(elemento: string, elementos: string[]) {
  const i = elementos.indexOf(elemento);
  return i < 0 ? '#555' : CORES[i % CORES.length];
}
