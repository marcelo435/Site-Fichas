import type { Ritual, Selo } from '../types';
import { CIRCULOS, FUSOES, SIMBOLOS, type Circulo, type Simbolo } from './altarDados';
import { uid } from './util';
import arteCarne from '../assets/altar/carne.png';
import arteEspirito from '../assets/altar/espirito.png';
import arteForma from '../assets/altar/forma.png';
import arteAlma from '../assets/altar/alma.png';
import arteAurora from '../assets/altar/aurora.png';

/** Desenho de cada círculo (tinta preta em fundo transparente; o site inverte para branco). */
export const ARTE: Record<string, string> = {
  carne: arteCarne, espirito: arteEspirito, forma: arteForma, alma: arteAlma, aurora: arteAurora,
};

export const SIMBOLO: Record<string, Simbolo> = Object.fromEntries(SIMBOLOS.map(s => [s.id, s]));

/** Espaço do círculo: 'c' = centro; número = nó (0 = o do topo, sentido horário). */
export type Vaga = 'c' | number;

export function circuloDe(id: string): Circulo {
  return CIRCULOS.find(c => c.id === id) ?? CIRCULOS[0];
}

export function seloVazio(circ = CIRCULOS[0].id): Selo {
  return { circ, centro: null, nos: Array.from({ length: circuloDe(circ).n }, () => null) };
}

/** Troca de círculo mantendo o que cabe (nós a mais são tirados). */
export function trocarCirculo(selo: Selo, circ: string): Selo {
  const n = circuloDe(circ).n;
  return { circ, centro: selo.centro, nos: Array.from({ length: n }, (_, i) => selo.nos[i] ?? null) };
}

export const simboloEm = (selo: Selo, v: Vaga) => (v === 'c' ? selo.centro : selo.nos[v] ?? null);

export function porEm(selo: Selo, v: Vaga, id: string | null): Selo {
  if (v === 'c') return { ...selo, centro: id };
  return { ...selo, nos: selo.nos.map((x, i) => (i === v ? id : x)) };
}

export const nomeDaVaga = (v: Vaga) => (v === 'c' ? 'Centro' : `Nó ${v + 1}`);

export interface Fusao { a: string; b: string; nome: string; leitura: string; uso: string }

export function fusao(a: string | null, b: string | null): Fusao | null {
  if (!a || !b) return null;
  const chave = [a, b].sort().join('+');
  const f = FUSOES.find(x => [x[0], x[1]].sort().join('+') === chave);
  return f ? { a, b, nome: f[2], leitura: f[3], uso: f[4] } : null;
}

/**
 * O que o círculo "lê": o centro diz o que o ritual faz (muda com o círculo) e cada nó diz como.
 * Dois símbolos vizinhos que combinam viram uma fusão (ex.: Fogo + Terra = Lava).
 */
export function leitura(selo: Selo): { texto: string; fusoes: Fusao[] } {
  const centro = selo.centro ? SIMBOLO[selo.centro] : null;
  if (!centro) return { texto: '', fusoes: [] };
  const ci = Math.max(0, CIRCULOS.findIndex(c => c.id === selo.circ));
  const partes: string[] = [];
  const fusoes: Fusao[] = [];
  const pular = new Set<number>();
  const f0 = fusao(selo.centro, selo.nos[0]);
  if (f0) { partes.push(f0.leitura); fusoes.push(f0); pular.add(0); } else partes.push(centro.c[ci]);
  for (let i = 0; i < selo.nos.length; i++) {
    const id = selo.nos[i];
    if (pular.has(i) || !id) continue;
    const j = i + 1;
    if (j < selo.nos.length && selo.nos[j] && !pular.has(j)) {
      const f = fusao(id, selo.nos[j]);
      if (f) { partes.push('com ' + f.leitura); fusoes.push(f); pular.add(i); pular.add(j); continue; }
    }
    partes.push(SIMBOLO[id].nf);
  }
  const t = partes.join(', ');
  return { texto: t.charAt(0).toUpperCase() + t.slice(1) + '.', fusoes };
}

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Texto (markdown) que vai para a descrição do ritual na biblioteca. */
export function descricaoDoSelo(selo: Selo): string {
  const c = circuloDe(selo.circ);
  const ci = CIRCULOS.indexOf(c);
  const l = leitura(selo);
  const linhas = [`**O círculo lê:** ${l.texto || '—'}`, '', `**Círculo ${c.de}:** ${c.dom.toLowerCase()}.`, ''];
  if (selo.centro) {
    const s = SIMBOLO[selo.centro];
    linhas.push(`- **Centro · ${s.nome}:** ${maiuscula(s.c[ci])}. ${s.nuc}`);
  }
  selo.nos.forEach((id, i) => {
    if (id) linhas.push(`- **Nó ${i + 1} · ${SIMBOLO[id].nome}:** ${SIMBOLO[id].no}`);
  });
  if (l.fusoes.length) {
    linhas.push('', '**Fusões:** ' + l.fusoes.map(f => `${SIMBOLO[f.a].nome} + ${SIMBOLO[f.b].nome} = ${f.nome} (${f.uso})`).join('; ') + '.');
  }
  return linhas.join('\n');
}

/** Cria (ou atualiza) um ritual da biblioteca a partir do desenho. */
export function ritualDoSelo(selo: Selo, nome: string, base?: Ritual): Ritual {
  const ci = Math.max(0, CIRCULOS.findIndex(c => c.id === selo.circ));
  return {
    id: base?.id ?? uid(),
    nome,
    elemento: base?.elemento ?? '',
    circulo: ci + 1,
    custo: base?.custo ?? '',
    execucao: base?.execucao ?? '',
    alcance: base?.alcance ?? '',
    alvo: base?.alvo ?? '',
    duracao: base?.duracao ?? '',
    resistencia: base?.resistencia ?? '',
    descricao: descricaoDoSelo(selo),
    criadoEm: base?.criadoEm ?? Date.now(),
    selo: { circ: selo.circ, centro: selo.centro, nos: [...selo.nos] },
  };
}

/** Linha de texto para copiar e colar (ex.: no livro). */
export function textoDoSelo(selo: Selo, nome: string): string {
  const c = circuloDe(selo.circ);
  const nos = selo.nos.filter((x): x is string => !!x).map(id => SIMBOLO[id].nome).join(', ');
  const centro = selo.centro ? SIMBOLO[selo.centro].nome : '—';
  return `${nome || 'Ritual sem nome'} | Círculo ${c.de} | ${centro}${nos ? ' → ' + nos : ''} | Leitura: ${leitura(selo).texto}`;
}
