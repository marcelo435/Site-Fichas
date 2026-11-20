import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import type { Capitulo, Dados, Ficha, GrupoProficiencia, InfoAtributo, Mesa, Pericia, Ritual, Sistema } from './types';
import { uid } from './lib/util';

const ARMAS = ['Armas Curtas', 'Armas de Média', 'Armas Longas', 'Armas Abissais'];

/** Valores iniciais. Tudo isso é editável na página "Sistema". */
export const SISTEMA_PADRAO: Sistema = {
  // sentido horário a partir do topo do pentágono
  atributos: ['Fortitude', 'Abismo', 'Destreza', 'Inteligência', 'Força'],
  infoAtributos: {
    Fortitude: { sigla: 'FOT', cor: '#e8e8ec', simbolo: '' },
    Abismo: { sigla: 'ABM', cor: '#e8e8ec', simbolo: '' },
    Destreza: { sigla: 'DES', cor: '#e8e8ec', simbolo: '' },
    Inteligência: { sigla: 'INT', cor: '#b9b9c0', simbolo: '' },
    Força: { sigla: 'FOR', cor: '#e8e8ec', simbolo: '' },
  },
  simboloCentro: '',
  // vazio = no meio fica o redemoinho do Abismo com os "Atributos base"
  elementoCentral: '',
  recursos: [
    { nome: 'Vida', cor: '#9b2335' },
    { nome: 'Sanidade', cor: '#6a2a8c' },
    { nome: 'Esforço (PE)', cor: '#8c6a1c' },
    { nome: 'Sede', cor: '#1f5f8c' },
    { nome: 'Fome', cor: '#8c4a1f' },
  ],
  pericias: [
    ...['Acrobacia', 'Furtividade', 'Mira', 'Reflexo'].map(nome => ({ nome, atributo: 'Destreza' })),
    ...['Atletismo', 'Luta'].map(nome => ({ nome, atributo: 'Força' })),
    ...['Intimidação', 'Conhecimento', 'Sobrevivência', 'Intuição', 'Invenção', 'Medicina', 'Percepção', 'Carisma',
      'Força de Vontade', 'Resistência Mental', 'Investigação'].map(nome => ({ nome, atributo: 'Inteligência' })),
    { nome: 'Constituição', atributo: 'Fortitude' },
    { nome: 'Arcana das Abissais', atributo: 'Abismo' },
    { nome: 'Resistência Abissal', atributo: 'Abismo' },
    { nome: 'Pontos de Esforço', atributo: 'Geral' },
  ],
  proficiencias: [
    { grupo: 'Armas de Fogo', itens: [...ARMAS] },
    { grupo: 'Marcial / Corpo a Corpo', itens: [...ARMAS] },
  ],
  elementos: ['Sangue', 'Morte', 'Mente', 'Energia', 'Abismo'],
  circulos: 4,
  // Rola {dados} d20 e fica com o maior (com 0 dados: só 1d20).
  rolagemAtributo: '{dados}d20kh1',
  rolagemPericia: '{dados}d20kh1+{valor}',
};

/** Padrões das versões antigas: se o usuário nunca mexeu, trocamos pelos novos. */
const ATRIBUTOS_V2 = ['Força', 'Agilidade', 'Intelecto', 'Presença', 'Vigor'];
const PERICIAS_V2 = [
  'Acrobacia', 'Atletismo', 'Ciências', 'Diplomacia', 'Enganação', 'Fortitude',
  'Furtividade', 'Intimidação', 'Intuição', 'Investigação', 'Luta', 'Medicina',
  'Ocultismo', 'Percepção', 'Pontaria', 'Reflexos', 'Sobrevivência', 'Vontade',
];
const iguais = (a: unknown, b: string[]) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);

/** Sigla automática: 3 primeiras letras sem acento. */
export const siglaDe = (nome: string) =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || '?';

export function infoAtributo(s: Sistema, nome: string): InfoAtributo {
  return s.infoAtributos[nome] ?? { sigla: siglaDe(nome), cor: '#e8e8ec', simbolo: '' };
}

/** Deixa o sistema completo, aceitando formatos antigos. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizarSistema(bruto: any): Sistema {
  const s: Sistema = { ...structuredClone(SISTEMA_PADRAO), ...(bruto ?? {}) };
  const antigo = !bruto?.infoAtributos;
  if (antigo) {
    if (iguais(bruto?.atributos, ATRIBUTOS_V2)) s.atributos = [...SISTEMA_PADRAO.atributos];
    if (iguais(bruto?.pericias, PERICIAS_V2)) s.pericias = structuredClone(SISTEMA_PADRAO.pericias);
    if (bruto?.rolagemAtributo === '1d20+{valor}') s.rolagemAtributo = SISTEMA_PADRAO.rolagemAtributo;
    if (bruto?.rolagemPericia === '1d20+{valor}') s.rolagemPericia = SISTEMA_PADRAO.rolagemPericia;
    // barras novas
    for (const nome of ['Sede', 'Fome']) {
      if (!s.recursos.some(r => r.nome === nome)) s.recursos.push(SISTEMA_PADRAO.recursos.find(r => r.nome === nome)!);
    }
    s.infoAtributos = {};
  }
  // perícias antigas eram só nomes
  s.pericias = (s.pericias as unknown[]).map(p =>
    typeof p === 'string' ? { nome: p, atributo: 'Geral' } : (p as Pericia));
  s.infoAtributos = { ...s.infoAtributos };
  for (const a of s.atributos) s.infoAtributos[a] ??= structuredClone(infoAtributo(SISTEMA_PADRAO, a));
  // o rosa antigo do Abismo vira branco como os outros
  for (const a of s.atributos) {
    if (s.infoAtributos[a].cor.toLowerCase() === '#f29bd4') s.infoAtributos[a] = { ...s.infoAtributos[a], cor: '#e8e8ec' };
  }
  s.proficiencias = (s.proficiencias ?? []) as GrupoProficiencia[];
  s.simboloCentro ??= '';
  if (s.elementoCentral && !s.atributos.includes(s.elementoCentral)) s.elementoCentral = '';
  return s;
}

export const dadosIniciais = (): Dados => ({
  sistema: structuredClone(SISTEMA_PADRAO),
  personagens: [],
  mesas: [],
  rituais: [],
  livro: [],
});

/** Garante que a ficha tem campo para cada atributo/recurso/perícia do sistema. */
export function normalizarFicha(f: Ficha, s: Sistema) {
  f.atributos ??= {};
  f.recursos ??= {};
  f.pericias ??= {};
  f.bonusPericias ??= {};
  f.proficiencias ??= [];
  f.inventario ??= [];
  f.rituais ??= [];
  f.pactos ??= [];
  f.ataques ??= [];
  f.habilidadesNivel ??= [];
  f.idade ??= '';
  f.altura ??= '';
  f.estiloCombate ??= '';
  f.familia ??= '';
  f.armadura ??= 0;
  f.statusAbismo ??= 0;
  f.defesa ??= 0;
  f.deslocamento ??= '';
  f.habilidades ??= '';
  for (const a of s.atributos) f.atributos[a] ??= 0;
  for (const r of s.recursos) f.recursos[r.nome] ??= { atual: 10, max: 10 };
  for (const p of s.pericias) {
    f.pericias[p.nome] ??= 0;
    f.bonusPericias[p.nome] ??= 0;
  }
  return f;
}

export function novaFicha(s: Sistema, dados: Partial<Ficha> = {}): Ficha {
  return normalizarFicha(
    {
      id: uid(),
      nome: 'Novo personagem',
      jogador: '',
      conceito: '',
      nivel: 1,
      idade: '',
      altura: '',
      estiloCombate: '',
      familia: '',
      retrato: '',
      atributos: {},
      recursos: {},
      pericias: {},
      bonusPericias: {},
      proficiencias: [],
      armadura: 0,
      defesa: 0,
      deslocamento: '8',
      statusAbismo: 0,
      pactos: [],
      ataques: [],
      habilidadesNivel: [],
      habilidades: '',
      inventario: [],
      rituais: [],
      anotacoes: '',
      criadaEm: Date.now(),
      atualizadaEm: Date.now(),
      ...dados,
    },
    s,
  );
}

export function ritualVazio(): Ritual {
  return {
    id: uid(), nome: '', elemento: '', circulo: 1, custo: '', execucao: '', alcance: '',
    alvo: '', duracao: '', resistencia: '', descricao: '', criadoEm: Date.now(),
  };
}

/**
 * Aceita dados de qualquer versão (inclusive a antiga, em que as fichas
 * ficavam dentro das mesas) e devolve no formato atual.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrarDados(d: any): Dados {
  const sistema = normalizarSistema(d?.sistema);
  const personagens: Ficha[] = Array.isArray(d?.personagens) ? [...d.personagens] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mesas: Mesa[] = (Array.isArray(d?.mesas) ? d.mesas : []).map((m: any) => {
    const ids: string[] = Array.isArray(m.personagens) ? [...m.personagens] : [];
    for (const f of Array.isArray(m.fichas) ? m.fichas : []) {
      if (!personagens.some(p => p.id === f.id)) personagens.push(f);
      if (!ids.includes(f.id)) ids.push(f.id);
    }
    return { id: m.id, nome: m.nome ?? '', descricao: m.descricao ?? '', personagens: ids, criadaEm: m.criadaEm ?? Date.now() };
  });
  for (const f of personagens) normalizarFicha(f, sistema);
  return {
    sistema,
    personagens,
    mesas,
    rituais: Array.isArray(d?.rituais) ? d.rituais : [],
    livro: Array.isArray(d?.livro) ? d.livro : [],
  };
}

interface Acoes {
  criarMesa(nome: string, descricao: string): string;
  editarMesa(id: string, dados: Partial<Pick<Mesa, 'nome' | 'descricao'>>): void;
  excluirMesa(id: string): void;
  vincular(mesaId: string, personagemId: string): void;
  desvincular(mesaId: string, personagemId: string): void;

  /** Cria um personagem; se mesaId vier, já coloca nessa mesa. */
  criarPersonagem(mesaId?: string): string;
  atualizarPersonagem(id: string, alterar: (f: Ficha) => void): void;
  duplicarPersonagem(id: string): string | undefined;
  excluirPersonagem(id: string): void;
  importarPersonagem(ficha: Ficha, rituais: Ritual[], mesaId?: string): string;

  salvarRitual(r: Ritual): void;
  excluirRitual(id: string): void;

  criarCapitulo(): string;
  atualizarCapitulo(id: string, dados: Partial<Capitulo>): void;
  moverCapitulo(id: string, delta: number): void;
  excluirCapitulo(id: string): void;

  salvarSistema(s: Sistema): void;
  substituirTudo(d: unknown): void;
}

export type Estado = Dados & Acoes;

export const useDados = create<Estado>()(
  persist(
    immer(set => ({
      ...dadosIniciais(),

      // ---------- Mesas ----------
      criarMesa(nome, descricao) {
        const id = uid();
        set(s => { s.mesas.push({ id, nome, descricao, personagens: [], criadaEm: Date.now() }); });
        return id;
      },
      editarMesa(id, dados) {
        set(s => {
          const m = s.mesas.find(x => x.id === id);
          if (m) Object.assign(m, dados);
        });
      },
      excluirMesa(id) {
        set(s => { s.mesas = s.mesas.filter(m => m.id !== id); });
      },
      vincular(mesaId, personagemId) {
        set(s => {
          const m = s.mesas.find(x => x.id === mesaId);
          if (m && !m.personagens.includes(personagemId)) m.personagens.push(personagemId);
        });
      },
      desvincular(mesaId, personagemId) {
        set(s => {
          const m = s.mesas.find(x => x.id === mesaId);
          if (m) m.personagens = m.personagens.filter(id => id !== personagemId);
        });
      },

      // ---------- Personagens ----------
      criarPersonagem(mesaId) {
        const id = uid();
        set(s => {
          s.personagens.push(novaFicha(s.sistema, { id }));
          if (mesaId) s.mesas.find(m => m.id === mesaId)?.personagens.push(id);
        });
        return id;
      },
      atualizarPersonagem(id, alterar) {
        set(s => {
          const f = s.personagens.find(x => x.id === id);
          if (!f) return;
          alterar(f);
          f.atualizadaEm = Date.now();
        });
      },
      duplicarPersonagem(id) {
        let novoId: string | undefined;
        set(s => {
          const f = s.personagens.find(x => x.id === id);
          if (!f) return;
          novoId = uid();
          s.personagens.push({
            ...structuredClone(current(f)),
            id: novoId,
            nome: `${f.nome} (cópia)`,
            criadaEm: Date.now(),
            atualizadaEm: Date.now(),
          });
        });
        return novoId;
      },
      excluirPersonagem(id) {
        set(s => {
          s.personagens = s.personagens.filter(f => f.id !== id);
          for (const m of s.mesas) m.personagens = m.personagens.filter(x => x !== id);
        });
      },
      importarPersonagem(ficha, rituais, mesaId) {
        const id = uid();
        set(s => {
          for (const r of rituais) if (!s.rituais.some(x => x.id === r.id)) s.rituais.push(r);
          s.personagens.push(normalizarFicha({ ...ficha, id, atualizadaEm: Date.now() }, s.sistema));
          if (mesaId) s.mesas.find(m => m.id === mesaId)?.personagens.push(id);
        });
        return id;
      },

      // ---------- Rituais ----------
      salvarRitual(r) {
        set(s => {
          const i = s.rituais.findIndex(x => x.id === r.id);
          if (i >= 0) s.rituais[i] = r;
          else s.rituais.push(r);
        });
      },
      excluirRitual(id) {
        set(s => {
          s.rituais = s.rituais.filter(r => r.id !== id);
          for (const f of s.personagens) f.rituais = f.rituais.filter(x => x !== id);
        });
      },

      // ---------- Livro (capítulos de texto) ----------
      criarCapitulo() {
        const id = uid();
        set(s => { s.livro.push({ id, titulo: 'Novo capítulo', conteudo: '' }); });
        return id;
      },
      atualizarCapitulo(id, dados) {
        set(s => {
          const c = s.livro.find(x => x.id === id);
          if (c) Object.assign(c, dados);
        });
      },
      moverCapitulo(id, delta) {
        set(s => {
          const i = s.livro.findIndex(c => c.id === id);
          const j = i + delta;
          if (i < 0 || j < 0 || j >= s.livro.length) return;
          [s.livro[i], s.livro[j]] = [s.livro[j], s.livro[i]];
        });
      },
      excluirCapitulo(id) {
        set(s => { s.livro = s.livro.filter(c => c.id !== id); });
      },

      // ---------- Sistema / backup ----------
      salvarSistema(bruto) {
        const sistema = normalizarSistema(bruto);
        set(s => {
          s.sistema = sistema;
          for (const f of s.personagens) normalizarFicha(f, sistema);
        });
      },
      substituirTudo(d) {
        const novo = migrarDados(d);
        set(s => {
          s.sistema = novo.sistema;
          s.personagens = novo.personagens;
          s.mesas = novo.mesas;
          s.rituais = novo.rituais;
          s.livro = novo.livro;
        });
      },
    })),
    {
      name: 'abismio',
      version: 3,
      partialize: ({ sistema, personagens, mesas, rituais, livro }) => ({ sistema, personagens, mesas, rituais, livro }),
      migrate: salvo => migrarDados(salvo),
      merge: (salvo, atual) => ({ ...atual, ...migrarDados(salvo ?? {}) }),
    },
  ),
);

/** Para chamar ações em handlers. */
export const acoes = () => useDados.getState();
