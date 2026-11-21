import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import type { Entrada, Ficha as TFicha, Sistema, ValorRecurso } from '../types';
import { acoes, infoAtributo, useDados } from '../store';
import { NumInput } from '../components/NumInput';
import { NaoEncontrado } from '../components/NaoEncontrado';
import { RitualCard } from '../components/RitualCard';
import { SimboloAtributo, SimboloCentro } from '../components/Simbolos';
import { baixarJSON, redimensionarImagem } from '../lib/arquivos';
import { rolarComModelo, rolarEMostrar } from '../lib/rolagem';
import { toast } from '../lib/toasts';
import { nomeArquivo, num, porcentagem, uid } from '../lib/util';
import { useTitulo } from '../lib/useTitulo';
import armaduraFundo from '../assets/status/armadura-fundo.png';
import armaduraLinhas from '../assets/status/armadura-linhas.png';
import classeFundo from '../assets/status/classe-fundo.png';
import classeLinhas from '../assets/status/classe-linhas.png';
import deslocamentoFundo from '../assets/status/deslocamento-fundo.png';
import deslocamentoLinhas from '../assets/status/deslocamento-linhas.png';
import abismoFundo from '../assets/status/abismo-fundo.png';
import abismoLinhas from '../assets/status/abismo-linhas.png';

type Aba = 'pacto' | 'combate' | 'habilidades' | 'rituais' | 'inventario' | 'anotacoes';
type Alterar = (fn: (f: TFicha) => void) => void;

/** Shift + clique = 5 de uma vez. */
const passo = (e: React.MouseEvent) => (e.shiftKey ? 5 : 1);

function IconeDado() {
  return (
    <svg viewBox="0 0 24 24" className="icone-dado" aria-hidden="true">
      <path d="M12 2 21 7v10l-9 5-9-5V7z M12 2 7.5 14.5h9z M3 7l4.5 7.5M21 7l-4.5 7.5M7.5 14.5 12 22l4.5-7.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Recursos                                                            */
/* ------------------------------------------------------------------ */

function BarraRecurso({ nome, cor, valor, aoMudar }: {
  nome: string;
  cor: string;
  valor: ValorRecurso;
  aoMudar: (v: ValorRecurso) => void;
}) {
  const pct = porcentagem(valor.atual, valor.max);
  return (
    <div className={`recurso ${valor.atual <= 0 ? 'zerado' : ''} ${pct <= 25 ? 'baixo' : ''}`} style={{ '--cor': cor } as CSSProperties}>
      <div className="recurso-topo">
        <span className="recurso-nome"><i />{nome}</span>
        <span className="recurso-ctrl">
          <button className="mini-redondo" title="−1 (Shift: −5)" aria-label={`Diminuir ${nome}`}
            onClick={e => aoMudar({ ...valor, atual: valor.atual - passo(e) })}>−</button>
          <NumInput className="recurso-num" value={valor.atual} aria-label={`${nome} atual`}
            onChange={atual => aoMudar({ ...valor, atual })} />
          <span className="recurso-sep">/</span>
          <NumInput className="recurso-num max" value={valor.max} aria-label={`${nome} máximo`}
            onChange={max => aoMudar({ ...valor, max })} />
          <button className="mini-redondo" title="+1 (Shift: +5)" aria-label={`Aumentar ${nome}`}
            onClick={e => aoMudar({ ...valor, atual: valor.atual + passo(e) })}>+</button>
        </span>
      </div>
      <div className="recurso-trilho"><div className="recurso-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Atributos: os próprios símbolos dos elementos                       */
/* ------------------------------------------------------------------ */

/** Aleatório fixo (a mesma semente sempre desenha o mesmo redemoinho/rachadura). */
function sementeira(s: number) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Redemoinho do Abismo no estilo do livro: pinceladas de pincel seco em arco, cada uma feita
 * de várias "cerdas" finas (com falhas e pontas desfiadas), girando e caindo para o centro.
 * Geradas uma vez só.
 */
const PINCELADAS = (() => {
  const r = sementeira(11);
  const lista: { d: string; largura: number; opacidade: number; falhas?: string; camada: number }[] = [];
  // distribuídas por igual: 8 posições em volta × 3 faixas de raio, defasadas entre si
  const VOLTA = 8, FAIXAS = 3;
  for (let s = 0; s < VOLTA * FAIXAS; s++) {
    const faixa = s % FAIXAS;
    const camada = 0;
    const a0 = ((Math.floor(s / FAIXAS) + faixa / FAIXAS) / VOLTA) * Math.PI * 2 + (r() - 0.5) * 0.15;
    const arco = 2.1 + r() * 0.5;                 // ~120° a 150°
    const r0 = 31 + faixa * 6 + r() * 2;          // raio onde a pincelada começa (fora)
    const queda = 9 + r() * 2;                    // quanto ela afunda para o centro
    const W = 2.4 + r() * 1.2;                    // largura do pincel
    const cerdas = Math.max(3, Math.round(W * 2.2));
    for (let j = 0; j < cerdas; j++) {
      const u = j / (cerdas - 1) - 0.5;
      const borda = Math.abs(u) * 2;              // 0 no meio do pincel, 1 na beirada
      const t0 = r() * 0.12 + borda * r() * 0.35; // cerdas da beirada começam depois…
      const t1 = 1 - r() * 0.1 - borda * r() * 0.4; // …e acabam antes (ponta desfiada)
      if (t1 - t0 < 0.15) continue;
      const fase = r() * 6;
      const pts: string[] = [];
      for (let k = 0; k <= 28; k++) {
        const t = t0 + ((t1 - t0) * k) / 28;
        const a = a0 + arco * t;
        const rr = r0 - queda * Math.pow(t, 1.4) + u * W * (1 - t * 0.35) + Math.sin(t * 7 + fase) * 0.15;
        pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)} ${(50 + rr * Math.sin(a)).toFixed(2)}`);
      }
      lista.push({
        d: 'M' + pts.join(' L'),
        largura: 0.18 + r() * 0.4,
        opacidade: (0.3 + r() * 0.6) * (1 - borda * 0.45),
        falhas: r() < 0.35 ? `${(2 + r() * 8).toFixed(1)} ${(0.5 + r() * 2).toFixed(1)}` : undefined,
        camada,
      });
    }
  }
  return lista;
})();

function VorticeAbismo() {
  const id = useId().replace(/:/g, '');
  const imagemPropria = useDados(s => s.sistema.simboloCentro);
  if (imagemPropria) {
    return (
      <div className="abismo-vortice" aria-hidden="true">
        <div className="vortice-camada c0"><SimboloCentro /></div>
      </div>
    );
  }
  return (
    <div className="abismo-vortice" aria-hidden="true">
      {[0].map(camada => (
        <svg key={camada} viewBox="0 0 100 100" className={`vortice-camada c${camada}`}>
          <defs>
            <filter id={`pincel-${id}-${camada}`} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed={camada + 3} />
              <feDisplacementMap in="SourceGraphic" scale="0.35" />
            </filter>
          </defs>
          <g filter={`url(#pincel-${id}-${camada})`} fill="none" stroke="currentColor" strokeLinecap="round">
            {PINCELADAS.filter(p => p.camada === camada).map((p, k) => (
              <path key={k} d={p.d} strokeWidth={p.largura} opacity={p.opacidade} strokeDasharray={p.falhas} />
            ))}
          </g>
        </svg>
      ))}
    </div>
  );
}

function Pentagono({ f, sistema, alterar }: { f: TFicha; sistema: Sistema; alterar: Alterar }) {
  // Opcional: um elemento no centro (Sistema → Atributos). Padrão: o redemoinho do Abismo.
  const central = sistema.atributos.includes(sistema.elementoCentral) ? sistema.elementoCentral : '';
  const externos = sistema.atributos.filter(a => a !== central);
  const n = externos.length;
  const RAIO = 36;
  const ponto = (i: number, r = RAIO) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  };
  const soma = sistema.atributos.reduce((t, a) => t + num(f.atributos[a]), 0);
  const mudar = (a: string, d: number) => alterar(x => { x.atributos[a] = Math.max(0, num(x.atributos[a]) + d); });

  const elemento = (a: string, estilo: CSSProperties, classe = '') => {
    const v = num(f.atributos[a]);
    const info = infoAtributo(sistema, a);
    return (
      <div key={a} className={`elemento ${classe}`}
        style={{ ...estilo, '--cor': info.cor, '--brilho': Math.min(v, 5) / 5 } as CSSProperties}>
        <div className="elemento-simbolo"><SimboloAtributo nome={a} /></div>
        <div className="elemento-valor">
          <button className="elemento-btn menos" title="−1 (Shift: −5)" aria-label={`Diminuir ${a}`}
            onClick={e => mudar(a, -passo(e))}>−</button>
          <NumInput className="elemento-num" value={v} aria-label={a}
            onChange={nv => alterar(x2 => { x2.atributos[a] = nv; })} />
          <button className="elemento-btn mais" title="+1 (Shift: +5)" aria-label={`Aumentar ${a}`}
            onClick={e => mudar(a, passo(e))}>+</button>
        </div>
        <button className="elemento-nome" title={`Rolar ${a}`}
          onClick={() => rolarComModelo(sistema.rolagemAtributo, v, `${f.nome} · ${a}`)}>
          {a}
          <IconeDado />
        </button>
      </div>
    );
  };

  return (
    <div className="pentagono">
      {/* o Abismo girando no meio */}
      <VorticeAbismo />

      {central ? (
        elemento(central, { left: '50%', top: '50%' }, 'central')
      ) : (
        <div className="pentagono-centro">
          <span className="pentagono-centro-texto">
            Atributos<br />base
            <strong title="Soma dos atributos">{soma}</strong>
          </span>
        </div>
      )}

      {externos.map((a, i) => {
        const [x, y] = ponto(i);
        return elemento(a, { left: `${x}%`, top: `${y}%` });
      })}
    </div>
  );
}

/** Ícones dos status: silhueta preta + detalhes claros, com o número em branco por cima. */
const ICONES_STATUS = {
  armadura: { fundo: armaduraFundo, linhas: armaduraLinhas, y: '8%' },
  classe: { fundo: classeFundo, linhas: classeLinhas, y: '-4%' },
  deslocamento: { fundo: deslocamentoFundo, linhas: deslocamentoLinhas, y: '4%' },
  abismo: { fundo: abismoFundo, linhas: abismoLinhas, y: '0%' },
};
const mascara = (url: string): CSSProperties => ({ maskImage: `url(${url})`, WebkitMaskImage: `url(${url})` });

function Status({ rotulo, icone, children }: { rotulo: string; icone: keyof typeof ICONES_STATUS; children: ReactNode }) {
  const ic = ICONES_STATUS[icone];
  return (
    <label className={`status-item status-${icone}`}>
      <span className="status-icone" style={{ '--dy': ic.y } as CSSProperties}>
        <i className="si-fundo" style={mascara(ic.fundo)} />
        <i className="si-linhas" style={mascara(ic.linhas)} />
        <span className="si-valor">{children}</span>
      </span>
      <span className="status-rotulo">{rotulo}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Perícias                                                            */
/* ------------------------------------------------------------------ */

/** Níveis de treino: 1–2 conhece, 3–4 treinado, 5–9 perito, 10+ mestre. */
const NIVEIS_TREINO = [
  { min: 10, classe: 'treino-mestre', nome: 'Mestre' },
  { min: 5, classe: 'treino-perito', nome: 'Perito' },
  { min: 3, classe: 'treino-alto', nome: 'Treinado' },
  { min: 1, classe: 'treino-medio', nome: 'Conhece' },
];
const nivelDoTreino = (t: number) => NIVEIS_TREINO.find(n => t >= n.min);
const nivelTreino = (t: number) => nivelDoTreino(t)?.classe ?? '';
const semAcento = (s: string) => s.normalize('NFD').replace(/[^\w\s]/g, '').toLowerCase();

/**
 * Como uma perícia é rolada (regra do Abismo):
 * - sem treino (0): usa o atributo base da perícia → 1d20 + atributo + bônus
 * - "Conhece" (1–2): soma o atributo base e a perícia → 1d20 + atributo + treino + bônus
 * - "Treinado" (3–4), "Perito" (5–9) ou "Mestre" (10+): tantos d20 quanto o atributo, fica com o MAIOR → + treino + bônus
 *   (atributo 0: não ganha dados do atributo, rola só 1d20)
 */
function comoRola(atributo: number, treino: number, bonus: number) {
  const usaAtributo = treino >= 3;
  // até "Conhece" o atributo entra como número somado; a partir de "Treinado" ele vira dados
  const soma = usaAtributo ? treino + bonus : atributo + treino + bonus;
  const partes = [atributo && `atributo ${atributo}`, treino && `perícia ${treino}`, bonus && `bônus ${bonus}`].filter(Boolean).join(' + ');
  const qtd = usaAtributo ? Math.max(1, atributo) : 1;
  const pega = qtd > 1 ? 'maior' : '';
  const somaTxt = soma === 0 ? '' : soma > 0 ? ` + ${soma}` : ` − ${Math.abs(soma)}`;
  const explicacao = usaAtributo
    ? atributo > 0
      ? `Treinado: rola ${qtd}d20 (um por ponto do atributo), fica com o maior e soma ${soma}.`
      : `Treinado, mas o atributo é 0: não ganha dados do atributo, rola só 1d20 e soma ${soma}.`
    : treino > 0
      ? `Conhece: rola 1d20 e soma o atributo base e a perícia (${partes} = ${soma}). Com treino 3 passa a rolar os dados do atributo.`
      : `Sem treino: rola 1d20 e usa o atributo base${partes ? ` (${partes} = ${soma})` : ' (0)'}.`;
  return { usaAtributo, qtd, pega, somaTxt, explicacao, dadosParaRolar: usaAtributo ? atributo : 1, soma };
}

function Pericias({ f, sistema, alterar }: { f: TFicha; sistema: Sistema; alterar: Alterar }) {
  const [busca, setBusca] = useState('');
  const [soTreinadas, setSoTreinadas] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const termo = semAcento(busca.trim());

  // grupos na ordem em que aparecem na lista do sistema
  const grupos: { nome: string; pericias: string[] }[] = [];
  for (const p of sistema.pericias) {
    if (termo && !semAcento(p.nome).includes(termo)) continue;
    if (soTreinadas && num(f.pericias[p.nome]) <= 0) continue;
    let g = grupos.find(x => x.nome === p.atributo);
    if (!g) grupos.push((g = { nome: p.atributo, pericias: [] }));
    g.pericias.push(p.nome);
  }

  return (
    <section className="painel pericias">
      <div className="pericias-topo">
        <h3>Perícias</h3>
        <input className="pericias-busca" type="search" placeholder="Buscar perícia…" value={busca}
          onChange={e => setBusca(e.target.value)} />
        <button className={`filtro ${soTreinadas ? 'ativo' : ''}`} onClick={() => setSoTreinadas(v => !v)}>
          Só treinadas
        </button>
        <button className={`filtro ${ajuda ? 'ativo' : ''}`} onClick={() => setAjuda(v => !v)} title="Como os dados funcionam">
          ? Como rolar
        </button>
      </div>

      {ajuda && (
        <div className="como-rolar">
          <div className="como-rolar-item">
            <span className="legenda">0</span>
            <div><strong>Sem treino</strong><small>1d20 + atributo base + bônus</small></div>
            <span className="exemplo"><IconeDado /> 1d20 + 2</span>
          </div>
          <div className="como-rolar-item">
            <span className="legenda treino-medio">1–2</span>
            <div><strong>Conhece</strong><small>1d20 + atributo base + perícia + bônus</small></div>
            <span className="exemplo"><IconeDado /> 1d20 + 3</span>
          </div>
          <div className="como-rolar-item">
            <span className="legenda treino-alto">3–4</span>
            <div><strong>Treinado</strong><small>1 d20 por ponto do atributo, fica com o <b>maior</b> + treino + bônus</small></div>
            <span className="exemplo"><IconeDado /><IconeDado /><IconeDado /> 3d20 maior + 3</span>
          </div>
          <div className="como-rolar-item">
            <span className="legenda treino-perito">5–9</span>
            <div><strong>Perito</strong><small>igual ao Treinado, com um número maior somado</small></div>
            <span className="exemplo"><IconeDado /><IconeDado /><IconeDado /> 3d20 maior + 5</span>
          </div>
          <div className="como-rolar-item">
            <span className="legenda treino-mestre">10</span>
            <div><strong>Mestre</strong><small>o máximo: mesmos dados, somando 10 ou mais</small></div>
            <span className="exemplo"><IconeDado /><IconeDado /><IconeDado /> 3d20 maior + 10</span>
          </div>
          <p className="dica">Exemplos com atributo 2 (Conhece com perícia 1: 2 + 1 = 3). Atributo 0 treinado: não ganha dados extras, rola só 1d20. Clique no nome ou na rolagem para rolar.</p>
        </div>
      )}

      <div className="linha-pericia cabeca">
        <span />
        <span>Rolagem</span>
        <span>Treino</span>
        <span>Bônus</span>
      </div>
      {grupos.length === 0 && <p className="dica">Nenhuma perícia encontrada.</p>}
      {grupos.map(g => {
        const ehAtributo = sistema.atributos.includes(g.nome);
        const info = infoAtributo(sistema, g.nome);
        const atributo = ehAtributo ? num(f.atributos[g.nome]) : 0;
        return (
          <div key={g.nome} className="grupo-pericia" style={{ '--cor': ehAtributo ? info.cor : '#8a8a90' } as CSSProperties}>
            <div className="grupo-pericia-titulo">
              {ehAtributo ? <span className="mini-simbolo"><SimboloAtributo nome={g.nome} /></span> : <i />}
              <span>{g.nome}</span>
              <span className="sigla">{info.sigla}</span>
              {ehAtributo && (
                <span className="grupo-dados" title={`${g.nome} ${atributo}: perícias Treinadas, Peritas e Mestres rolam ${Math.max(1, atributo)}d20`}>
                  {g.nome} {atributo} → treinado rola <IconeDado /> {Math.max(1, atributo)}d20
                </span>
              )}
            </div>
            {g.pericias.map(p => {
              const treino = num(f.pericias[p]);
              const bonus = num(f.bonusPericias[p]);
              const r = comoRola(atributo, treino, bonus);
              const rolar = () => rolarComModelo(sistema.rolagemPericia, r.soma, `${f.nome} · ${p}`, r.dadosParaRolar);
              const nivel = nivelTreino(treino);
              return (
                <div key={p} className={`linha-pericia ${treino > 0 ? 'treinada' : ''}`}>
                  <button className="pericia-nome" title={`Rolar ${p}`} onClick={rolar}>
                    <span>{p}</span>
                    {treino > 0 && <em className={`nivel-tag ${nivel}`}>{nivelDoTreino(treino)?.nome}</em>}
                  </button>
                  <button className={`rolagem-chip ${r.usaAtributo ? nivel : 'base'}`} title={r.explicacao} onClick={rolar}>
                    <span className="chip-dados">
                      {Array.from({ length: Math.min(r.qtd, 3) }, (_, k) => <IconeDado key={k} />)}
                    </span>
                    <span className="chip-formula">
                      {r.qtd}d20{r.pega && <small>{r.pega}</small>}{r.somaTxt}
                    </span>
                  </button>
                  <NumInput className={`caixa-num ${nivel}`} value={treino} aria-label={`${p}: treinamento`}
                    onChange={v => alterar(x => { x.pericias[p] = v; })} />
                  <NumInput className="caixa-num" value={bonus} aria-label={`${p}: bônus`}
                    onChange={v => alterar(x => { x.bonusPericias[p] = v; })} />
                </div>
              );
            })}
          </div>
        );
      })}
      <p className="dica">
        Sem treino: 1d20 + atributo · <span className="legenda treino-medio">1–2 Conhece</span> 1d20 + atributo + perícia ·{' '}
        <span className="legenda treino-alto">3–4 Treinado</span>, <span className="legenda treino-perito">5–9 Perito</span> e{' '}
        <span className="legenda treino-mestre">10 Mestre</span>{' '}
        rolam os dados do atributo e ficam com o maior. Passe o mouse na rolagem para ver a explicação.
      </p>
    </section>
  );
}

function Proficiencias({ f, sistema, alterar }: { f: TFicha; sistema: Sistema; alterar: Alterar }) {
  if (!sistema.proficiencias.length) return null;
  return (
    <section className="painel">
      <h3>Proficiências de armas</h3>
      <div className="proficiencias">
        {sistema.proficiencias.map(g => (
          <div key={g.grupo}>
            <h4>{g.grupo}</h4>
            <div className="pilulas">
              {g.itens.map(item => {
                const k = `${g.grupo}::${item}`;
                const marcado = f.proficiencias.includes(k);
                return (
                  <button key={k} className={`pilula ${marcado ? 'ativo' : ''}`} aria-pressed={marcado}
                    onClick={() => alterar(x => {
                      x.proficiencias = marcado ? x.proficiencias.filter(p => p !== k) : [...x.proficiencias, k];
                    })}>
                    {marcado ? '✓ ' : ''}{item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Abas                                                                */
/* ------------------------------------------------------------------ */

function ListaEntradas({ lista, alterarLista, novo, vazio, comNivel }: {
  lista: Entrada[];
  alterarLista: (fn: (l: Entrada[]) => void) => void;
  novo: string;
  vazio: string;
  comNivel?: boolean;
}) {
  return (
    <>
      <button className="btn" onClick={() => alterarLista(l => { l.push({ id: uid(), nome: '', descricao: '', ...(comNivel ? { nivel: 1 } : {}) }); })}>
        {novo}
      </button>
      {lista.length === 0 && <p className="dica">{vazio}</p>}
      <div className="entradas">
        {lista.map((e, i) => (
          <div key={e.id} className="entrada">
            <div className="entrada-topo">
              {comNivel && (
                <label className="entrada-nivel">
                  Nv
                  <NumInput value={e.nivel ?? 1} onChange={v => alterarLista(l => { l[i].nivel = v; })} />
                </label>
              )}
              <input className="entrada-nome" value={e.nome} placeholder="Nome" autoFocus={!e.nome && i === lista.length - 1}
                onChange={ev => alterarLista(l => { l[i].nome = ev.target.value; })} />
              <button className="mini-btn perigo" title="Remover"
                onClick={() => { if (!e.nome || confirm(`Remover "${e.nome}"?`)) alterarLista(l => { l.splice(i, 1); }); }}>✕</button>
            </div>
            <textarea rows={3} value={e.descricao} placeholder="Descrição, efeitos, custo..."
              onChange={ev => alterarLista(l => { l[i].descricao = ev.target.value; })} />
          </div>
        ))}
      </div>
    </>
  );
}

function AbaCombate({ f, alterar }: { f: TFicha; alterar: Alterar }) {
  const campo = (i: number, k: 'nome' | 'teste' | 'dano' | 'critico' | 'alcance' | 'obs', ph: string) => (
    <input value={f.ataques[i][k]} placeholder={ph}
      onChange={e => alterar(x => { x.ataques[i][k] = e.target.value; })} />
  );
  return (
    <>
      <button className="btn" onClick={() => alterar(x => {
        x.ataques.push({ id: uid(), nome: '', teste: '', dano: '', critico: '', alcance: '', obs: '' });
      })}>Novo ataque</button>
      {f.ataques.length === 0 ? (
        <p className="dica">Nenhum ataque. Teste e dano aceitam dados, ex.: <code>2d20kh1+3</code>, <code>1d8+2</code>.</p>
      ) : (
        <table className="inventario ataques">
          <thead>
            <tr><th>Arma / ataque</th><th>Teste</th><th>Dano</th><th>Crítico</th><th>Alcance</th><th>Obs.</th><th /></tr>
          </thead>
          <tbody>
            {f.ataques.map((a, i) => (
              <tr key={a.id}>
                <td>{campo(i, 'nome', 'Nome')}</td>
                <td>
                  <div className="com-botao">
                    {campo(i, 'teste', '2d20kh1+2')}
                    <button className="rolar-icone" title="Rolar teste" disabled={!a.teste}
                      onClick={() => rolarEMostrar(a.teste, `${a.nome || 'Ataque'} · teste`)}>🎲</button>
                  </div>
                </td>
                <td>
                  <div className="com-botao">
                    {campo(i, 'dano', '1d8+2')}
                    <button className="rolar-icone" title="Rolar dano" disabled={!a.dano}
                      onClick={() => rolarEMostrar(a.dano, `${a.nome || 'Ataque'} · dano`)}>🎲</button>
                  </div>
                </td>
                <td className="n">{campo(i, 'critico', '19/x2')}</td>
                <td className="n">{campo(i, 'alcance', 'Curto')}</td>
                <td>{campo(i, 'obs', '')}</td>
                <td>
                  <button className="mini-btn perigo" title="Remover" onClick={() => alterar(x => { x.ataques.splice(i, 1); })}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function AbaInventario({ f, alterar }: { f: TFicha; alterar: Alterar }) {
  const total = f.inventario.reduce((t, it) => t + num(it.qtd) * num(it.espaco), 0);
  return (
    <>
      {f.inventario.length === 0 ? (
        <p className="dica">Inventário vazio.</p>
      ) : (
        <table className="inventario">
          <thead>
            <tr><th>Item</th><th className="n">Qtd</th><th className="n">Espaço</th><th>Descrição</th><th /></tr>
          </thead>
          <tbody>
            {f.inventario.map((it, i) => (
              <tr key={it.id}>
                <td>
                  <input value={it.nome} placeholder="Nome" autoFocus={!it.nome && i === f.inventario.length - 1}
                    onChange={e => alterar(x => { x.inventario[i].nome = e.target.value; })} />
                </td>
                <td className="n">
                  <NumInput value={it.qtd} onChange={n => alterar(x => { x.inventario[i].qtd = n; })} />
                </td>
                <td className="n">
                  <NumInput value={it.espaco} onChange={n => alterar(x => { x.inventario[i].espaco = n; })} />
                </td>
                <td>
                  <input value={it.desc} placeholder="Detalhes"
                    onChange={e => alterar(x => { x.inventario[i].desc = e.target.value; })} />
                </td>
                <td>
                  <button className="mini-btn perigo" title="Remover"
                    onClick={() => alterar(x => { x.inventario.splice(i, 1); })}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="rodape-aba">
        <button className="btn" onClick={() => alterar(x => { x.inventario.push({ id: uid(), nome: '', qtd: 1, espaco: 1, desc: '' }); })}>
          + Item
        </button>
        <span>Espaço total: <strong>{total}</strong></span>
      </div>
    </>
  );
}

function AbaRituais({ f, alterar }: { f: TFicha; alterar: Alterar }) {
  const todos = useDados(s => s.rituais);
  const vinculados = f.rituais.map(id => todos.find(r => r.id === id)).filter(r => r !== undefined);
  const disponiveis = todos
    .filter(r => !f.rituais.includes(r.id))
    .sort((a, b) => a.circulo - b.circulo || a.nome.localeCompare(b.nome));
  const [escolhido, setEscolhido] = useState('');
  const selecionado = disponiveis.some(r => r.id === escolhido) ? escolhido : disponiveis[0]?.id ?? '';

  if (todos.length === 0) {
    return (
      <p className="dica">
        Nenhum ritual criado ainda. <Link to="/rituais">Crie rituais na aba Rituais</Link> e depois adicione aqui.
      </p>
    );
  }

  return (
    <>
      <div className="add-ritual">
        <select value={selecionado} disabled={!disponiveis.length} onChange={e => setEscolhido(e.target.value)}>
          {disponiveis.length ? (
            disponiveis.map(r => (
              <option key={r.id} value={r.id}>
                {r.nome} — {r.circulo}º círculo{r.elemento ? ` · ${r.elemento}` : ''}
              </option>
            ))
          ) : (
            <option>Todos os rituais já foram adicionados</option>
          )}
        </select>
        <button className="btn" disabled={!selecionado} onClick={() => alterar(x => { x.rituais.push(selecionado); })}>
          Adicionar
        </button>
        <Link className="btn" to="/rituais">Gerenciar rituais</Link>
      </div>
      <div className="lista-rituais">
        {vinculados.map(r => (
          <RitualCard key={r.id} ritual={r}>
            <button className="btn mini perigo" onClick={() => alterar(x => { x.rituais = x.rituais.filter(id => id !== r.id); })}>
              Remover da ficha
            </button>
          </RitualCard>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export function Ficha() {
  const { personagemId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const f = useDados(s => s.personagens.find(x => x.id === personagemId));
  const mesas = useDados(s => s.mesas);
  const sistema = useDados(s => s.sistema);
  const todosRituais = useDados(s => s.rituais);
  const [aba, setAba] = useState<Aba>('pacto');
  const inputRetrato = useRef<HTMLInputElement>(null);
  useTitulo(f?.nome ?? 'Ficha');

  if (!f) return <NaoEncontrado msg="Personagem não encontrado." />;

  // Se veio de uma mesa, a navegação mostra a mesa; senão, a lista de personagens.
  const mesaOrigem = mesas.find(m => m.id === params.get('mesa'));
  const emMesas = mesas.filter(m => m.personagens.includes(f.id));
  const alterar: Alterar = fn => acoes().atualizarPersonagem(f.id, fn);
  const qtdRituais = f.rituais.filter(id => todosRituais.some(r => r.id === id)).length;

  const trocarRetrato = async (arq?: File) => {
    if (!arq) return;
    try {
      const url = await redimensionarImagem(arq, 480);
      alterar(x => { x.retrato = url; });
    } catch (e) {
      toast((e as Error).message, 'erro');
    }
  };

  const exportar = () => {
    const rituais = todosRituais.filter(r => f.rituais.includes(r.id));
    baixarJSON(`ficha-${nomeArquivo(f.nome)}.json`, { tipo: 'ficha', versao: 2, ficha: f, rituais });
  };

  const excluir = () => {
    const aviso = emMesas.length ? `\nEle será removido de: ${emMesas.map(m => m.nome).join(', ')}.` : '';
    if (!confirm(`Excluir o personagem "${f.nome}" de vez?${aviso}`)) return;
    navigate(mesaOrigem ? `/mesa/${mesaOrigem.id}` : '/personagens');
    acoes().excluirPersonagem(f.id);
  };

  type CampoTexto = 'jogador' | 'conceito' | 'idade' | 'altura' | 'estiloCombate' | 'familia';
  const campo = (k: CampoTexto, rotulo: string, ph = '') => (
    <label className="campo-flutuante">
      <input value={f[k]} placeholder={ph || ' '} onChange={e => alterar(x => { x[k] = e.target.value; })} />
      <span>{rotulo}</span>
    </label>
  );

  const abas: [Aba, string, number?][] = [
    ['pacto', 'Pacto', f.pactos.length],
    ['combate', 'Combate', f.ataques.length],
    ['habilidades', 'Habilidades de nível', f.habilidadesNivel.length],
    ['rituais', 'Rituais', qtdRituais],
    ['inventario', 'Inventário', f.inventario.length],
    ['anotacoes', 'Anotações'],
  ];

  return (
    <div className="ficha">
      <div className="ficha-barra">
        <div className="migalhas">
          {mesaOrigem ? (
            <><Link to="/mesas">Mesas</Link> › <Link to={`/mesa/${mesaOrigem.id}`}>{mesaOrigem.nome}</Link></>
          ) : (
            <Link to="/personagens">Personagens</Link>
          )}
          {' › '}<span>{f.nome}</span>
          {emMesas.length > 0 && (
            <span className="chips-mesa">
              {emMesas.map(m => <Link key={m.id} className="tag" to={`/mesa/${m.id}`}>{m.nome}</Link>)}
            </span>
          )}
        </div>
        <div className="acoes">
          <button className="btn mini" onClick={exportar}>Exportar</button>
          <button className="btn mini" onClick={() => {
            const id = acoes().duplicarPersonagem(f.id);
            if (id) navigate(`/personagem/${id}`);
          }}>Duplicar</button>
          <button className="btn mini perigo" onClick={excluir}>Excluir</button>
        </div>
      </div>

      {/* ---------- cabeçalho: retrato + identidade ---------- */}
      <section className="painel heroi">
        <div className="retrato" title="Clique para trocar o retrato" onClick={() => inputRetrato.current?.click()}>
          {f.retrato ? <img src={f.retrato} alt="" /> : <span>+ Retrato</span>}
          {f.retrato && (
            <button className="remover-retrato" title="Remover retrato"
              onClick={e => { e.stopPropagation(); alterar(x => { x.retrato = ''; }); }}>✕</button>
          )}
          <input ref={inputRetrato} type="file" accept="image/*" hidden
            onChange={e => { trocarRetrato(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <div className="heroi-info">
          <div className="heroi-titulo">
            <input className="heroi-nome" value={f.nome} placeholder="Nome do personagem" aria-label="Nome"
              onChange={e => alterar(x => { x.nome = e.target.value; })} />
            <label className="heroi-nivel" title="Nível">
              <span>Nv</span>
              <NumInput value={f.nivel} aria-label="Nível" onChange={v => alterar(x => { x.nivel = v; })} />
            </label>
          </div>
          <div className="heroi-campos">
            {campo('jogador', 'Jogador')}
            {campo('conceito', 'Pacto / Origem')}
            {campo('estiloCombate', 'Estilo de combate')}
            {campo('idade', 'Idade')}
            {campo('altura', 'Altura')}
            {campo('familia', 'Família')}
          </div>
          <div className="heroi-status">
            <Status rotulo="Armadura" icone="armadura">
              <NumInput value={f.armadura} onChange={v => alterar(x => { x.armadura = v; })} />
            </Status>
            <Status rotulo="Classe de armadura" icone="classe">
              <NumInput value={f.defesa} onChange={v => alterar(x => { x.defesa = v; })} />
            </Status>
            <Status rotulo="Deslocamento" icone="deslocamento">
              <input value={f.deslocamento} placeholder="–" onChange={e => alterar(x => { x.deslocamento = e.target.value; })} />
            </Status>
            <Status rotulo="Porcentagem abissal" icone="abismo">
              <NumInput value={f.statusAbismo} onChange={v => alterar(x => { x.statusAbismo = v; })} />
              <small>%</small>
            </Status>
          </div>
        </div>
      </section>

      <div className="ficha-grade">
        <div className="ficha-col">
          <section className="painel">
            <h3>Recursos</h3>
            <div className="recursos">
              {sistema.recursos.map(r => (
                <BarraRecurso key={r.nome} nome={r.nome} cor={r.cor}
                  valor={f.recursos[r.nome] ?? { atual: 10, max: 10 }}
                  aoMudar={v => alterar(x => { x.recursos[r.nome] = v; })} />
              ))}
            </div>
          </section>

          <section className="painel painel-atributos">
            <h3>Atributos</h3>
            <Pentagono f={f} sistema={sistema} alterar={alterar} />
            <p className="dica centro">Clique no nome do elemento para rolar.</p>
          </section>
        </div>

        <div className="ficha-col">
          <Pericias f={f} sistema={sistema} alterar={alterar} />
          <Proficiencias f={f} sistema={sistema} alterar={alterar} />
        </div>
      </div>

      <nav className="abas-ficha">
        {abas.map(([id, rotulo, qtd]) => (
          <button key={id} className={aba === id ? 'ativo' : ''} onClick={() => setAba(id)}>
            {rotulo}
            {!!qtd && <span className="contador">{qtd}</span>}
          </button>
        ))}
      </nav>

      <section className="painel conteudo-aba">
        {aba === 'pacto' && (
          <ListaEntradas lista={f.pactos} novo="Novo pacto" vazio="Nenhum pacto ainda."
            alterarLista={fn => alterar(x => fn(x.pactos))} />
        )}
        {aba === 'combate' && <AbaCombate f={f} alterar={alterar} />}
        {aba === 'habilidades' && (
          <>
            <ListaEntradas comNivel lista={[...f.habilidadesNivel].sort((a, b) => num(a.nivel) - num(b.nivel))}
              novo="Nova habilidade" vazio="Nenhuma habilidade ainda."
              alterarLista={fn => alterar(x => {
                x.habilidadesNivel.sort((a, b) => num(a.nivel) - num(b.nivel));
                fn(x.habilidadesNivel);
              })} />
            {f.habilidades && (
              <label className="campo">
                Habilidades (texto livre)
                <textarea className="texto-grande" value={f.habilidades}
                  onChange={e => alterar(x => { x.habilidades = e.target.value; })} />
              </label>
            )}
          </>
        )}
        {aba === 'anotacoes' && (
          <textarea className="texto-grande" value={f.anotacoes}
            placeholder="Anotações livres: história, contatos, pistas, objetivos..."
            onChange={e => alterar(x => { x.anotacoes = e.target.value; })} />
        )}
        {aba === 'inventario' && <AbaInventario f={f} alterar={alterar} />}
        {aba === 'rituais' && <AbaRituais f={f} alterar={alterar} />}
      </section>
    </div>
  );
}
