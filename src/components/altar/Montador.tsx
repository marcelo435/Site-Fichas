import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Selo } from '../../types';
import { CIRCULOS, FAMILIA_SINGULAR, FAMILIAS, SIMBOLOS, type Familia } from '../../lib/altarDados';
import { circuloDe, leitura, nomeDaVaga, porEm, SIMBOLO, simboloEm, trocarCirculo, type Vaga } from '../../lib/altar';
import { Circulo, Glifo } from './Circulo';

type Origem = 'lista' | Vaga;
interface Arrasto { id: string; de: Origem; x: number; y: number; alvo: Vaga | null; fora: boolean }
interface Toque { id: string; de: Origem; sx: number; sy: number; pid: number; ativo: boolean; timer?: number }

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Espaço do desenho mais perto do ponto (ou null se nenhum estiver perto). */
function vagaNoPonto(svg: SVGSVGElement | null, x: number, y: number): Vaga | null {
  if (!svg) return null;
  let melhor: string | null = null;
  let menor = Infinity;
  svg.querySelectorAll<SVGGElement>('[data-vaga]').forEach(g => {
    const anel = g.querySelector('.anel');
    if (!anel) return;
    const r = anel.getBoundingClientRect();
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < (r.width / 2) * 1.35 + 6 && d < menor) { menor = d; melhor = g.dataset.vaga ?? null; }
  });
  if (melhor === null) return null;
  return melhor === 'c' ? 'c' : Number(melhor);
}

function dentroDoDesenho(svg: SVGSVGElement | null, x: number, y: number) {
  if (!svg) return false;
  const r = svg.getBoundingClientRect();
  return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < r.width * 0.47;
}

interface Props {
  selo: Selo;
  mudar: (s: Selo) => void;
  /** botões e campos que ficam embaixo da leitura */
  rodape?: ReactNode;
}

/** O criador do mestre: círculo, lista dos 40 símbolos e o significado de cada parte. */
export function Montador({ selo, mudar, rodape }: Props) {
  const [sel, setSel] = useState<Vaga>('c');
  const [familia, setFamilia] = useState<Familia | ''>('');
  const [pulso, setPulso] = useState<{ vaga: Vaga; n: number } | null>(null);
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const seloRef = useRef(selo);
  const mudarRef = useRef(mudar);
  const toque = useRef<Toque | null>(null);
  const arrastoRef = useRef<Arrasto | null>(null);
  const acabouDeSoltar = useRef(false);
  const contador = useRef(0);
  useEffect(() => { seloRef.current = selo; mudarRef.current = mudar; });

  const c = circuloDe(selo.circ);
  const ci = CIRCULOS.indexOf(c);
  const vagaSel: Vaga = sel !== 'c' && sel >= c.n ? 'c' : sel;
  const l = leitura(selo);

  const encaixe = (v: Vaga) => setPulso({ vaga: v, n: ++contador.current });

  /** Coloca o símbolo no espaço escolhido e pula para o próximo nó vazio. */
  const colocar = (id: string) => {
    if (acabouDeSoltar.current) return;
    const novo = porEm(selo, vagaSel, id);
    mudar(novo);
    encaixe(vagaSel);
    const inicio = vagaSel === 'c' ? 0 : vagaSel + 1;
    const prox = novo.nos.findIndex((x, i) => i >= inicio && !x);
    if (prox >= 0) setSel(prox);
  };

  const tirar = (v: Vaga) => {
    if (simboloEm(selo, v)) mudar(porEm(selo, v, null));
    setSel(v);
  };

  // ---------- arrastar e soltar ----------
  const comecar = (x: number, y: number) => {
    const t = toque.current;
    if (!t) return;
    t.ativo = true;
    const a: Arrasto = { id: t.id, de: t.de, x, y, alvo: vagaNoPonto(svgRef.current, x, y), fora: false };
    arrastoRef.current = a;
    setArrasto(a);
    navigator.vibrate?.(8);
  };

  const pressionar = (id: string, de: Origem, e: ReactPointerEvent) => {
    if (e.button > 0) return;
    const t: Toque = { id, de, sx: e.clientX, sy: e.clientY, pid: e.pointerId, ativo: false };
    // no celular, segurar um instante na lista começa o arrasto (assim a lista ainda rola)
    if (e.pointerType === 'touch' && de === 'lista') t.timer = window.setTimeout(() => comecar(t.sx, t.sy), 230);
    toque.current = t;
  };

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      const t = toque.current;
      if (!t || e.pointerId !== t.pid) return;
      if (!t.ativo) {
        if (Math.hypot(e.clientX - t.sx, e.clientY - t.sy) <= 6) return;
        if (e.pointerType === 'touch' && t.de === 'lista') { clearTimeout(t.timer); toque.current = null; return; }
        comecar(e.clientX, e.clientY);
      }
      const svg = svgRef.current;
      const a: Arrasto = {
        ...(arrastoRef.current as Arrasto), x: e.clientX, y: e.clientY,
        alvo: vagaNoPonto(svg, e.clientX, e.clientY), fora: !dentroDoDesenho(svg, e.clientX, e.clientY),
      };
      arrastoRef.current = a;
      setArrasto(a);
    };
    const soltar = (e: PointerEvent, cancelar: boolean) => {
      const t = toque.current;
      if (!t || e.pointerId !== t.pid) return;
      clearTimeout(t.timer);
      toque.current = null;
      const a = arrastoRef.current;
      if (!t.ativo || !a) return;
      arrastoRef.current = null;
      setArrasto(null);
      acabouDeSoltar.current = true;
      setTimeout(() => { acabouDeSoltar.current = false; }, 60);
      if (cancelar) return;
      const s = seloRef.current;
      if (a.alvo !== null) {
        let novo = s;
        if (a.de === 'lista') novo = porEm(s, a.alvo, a.id);
        else if (a.alvo !== a.de) novo = porEm(porEm(s, a.alvo, a.id), a.de, simboloEm(s, a.alvo));
        mudarRef.current(novo);
        setSel(a.alvo);
        setPulso({ vaga: a.alvo, n: ++contador.current });
      } else if (a.de !== 'lista' && a.fora) {
        mudarRef.current(porEm(s, a.de, null));
        setSel(a.de);
      }
    };
    const solta = (e: PointerEvent) => soltar(e, false);
    const cancela = (e: PointerEvent) => soltar(e, true);
    const travarRolagem = (e: TouchEvent) => { if (toque.current?.ativo) e.preventDefault(); };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', solta);
    window.addEventListener('pointercancel', cancela);
    window.addEventListener('touchmove', travarRolagem, { passive: false });
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', solta);
      window.removeEventListener('pointercancel', cancela);
      window.removeEventListener('touchmove', travarRolagem);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('arrastando-simbolo', !!arrasto);
  }, [arrasto]);

  // ---------- painel do lado ----------
  const idSel = simboloEm(selo, vagaSel);
  const usados = new Set([selo.centro, ...selo.nos].filter(Boolean));
  const lista = SIMBOLOS.filter(s => !familia || s.fam === familia);

  const painelMestre = (
    <div className="montador-info">
      <h3>{nomeDaVaga(vagaSel)}{idSel ? `: ${SIMBOLO[idSel].nome}` : ''}</h3>
      {idSel ? (
        <>
          <p className="essencia">{SIMBOLO[idSel].ess}</p>
          <dl>
            {vagaSel === 'c' ? (
              <><dt>No centro do círculo {c.de}</dt><dd>{maiuscula(SIMBOLO[idSel].c[ci])}. {SIMBOLO[idSel].nuc}</dd></>
            ) : (
              <><dt>Neste nó</dt><dd>{SIMBOLO[idSel].no}</dd></>
            )}
            <dt>Combina com</dt><dd>{SIMBOLO[idSel].comb}</dd>
          </dl>
        </>
      ) : (
        <p className="dica">
          {vagaSel === 'c'
            ? 'O centro é o núcleo: o que o ritual faz. Escolha um símbolo abaixo para colocar aqui.'
            : 'Este nó é um modificador: como, onde ou em quem o ritual age. Escolha um símbolo abaixo.'}
        </p>
      )}
      <div className="chips-familia">
        <button className={`filtro ${!familia ? 'ativo' : ''}`} onClick={() => setFamilia('')}>Todos</button>
        {(Object.keys(FAMILIAS) as Familia[]).map(f => (
          <button key={f} className={`filtro ${familia === f ? 'ativo' : ''}`} onClick={() => setFamilia(f)}>{FAMILIAS[f]}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="montador mestre">
      <section className="painel montador-palco">
        <div className="chips-circulo" role="group" aria-label="Círculo">
          {CIRCULOS.map(x => (
            <button key={x.id} className={`filtro ${x.id === selo.circ ? 'ativo' : ''}`}
              onClick={() => { mudar(trocarCirculo(selo, x.id)); encaixe('c'); }}>
              {x.nome} <small>{x.n} nós</small>
            </button>
          ))}
        </div>
        <p className="circulo-info"><b>Círculo {c.de}:</b> {c.dom.toLowerCase()}. Cria {c.cria}.</p>
        <Circulo ref={svgRef} selo={selo} sel={vagaSel} alvo={arrasto?.alvo ?? null}
          erguido={arrasto && arrasto.de !== 'lista' ? arrasto.de : null} pulso={pulso}
          aoClicar={v => { if (!acabouDeSoltar.current) setSel(v); }}
          aoDuploClique={tirar}
          aoPressionar={(v, e) => { const id = simboloEm(selo, v); if (id) pressionar(id, v, e); }} />
        <p className="dica montador-ajuda">
          Arraste um símbolo até o desenho. Arraste de um espaço para outro para trocar, ou para fora do desenho para tirar.
          Dois cliques num símbolo também tiram.
        </p>
        <div className={`leitura-circulo ${l.texto ? 'viva' : ''}`} aria-live="polite">
          <span className="leitura-rotulo">O círculo lê</span>
          <p key={l.texto}>{l.texto || 'Arraste um símbolo até o centro do círculo.'}</p>
          {l.fusoes.length > 0 && (
            <small>{l.fusoes.map(f => `${SIMBOLO[f.a].nome} + ${SIMBOLO[f.b].nome} = ${f.nome}`).join(' · ')}</small>
          )}
        </div>
        {(selo.centro || selo.nos.some(Boolean)) && (
          <ul className="partes-ritual">
            {selo.centro && (
              <li><Glifo id={selo.centro} tamanho={24} />
                <span><b>Centro, {SIMBOLO[selo.centro].nome}:</b> {SIMBOLO[selo.centro].c[ci]}. {SIMBOLO[selo.centro].nuc}</span></li>
            )}
            {selo.nos.map((id, i) => id && (
              <li key={i}><Glifo id={id} tamanho={24} /><span><b>Nó {i + 1}, {SIMBOLO[id].nome}:</b> {SIMBOLO[id].no}</span></li>
            ))}
            {l.fusoes.map(f => (
              <li key={f.nome} className="fusao"><span><b>Fusão {f.nome}:</b> {f.uso}.</span></li>
            ))}
          </ul>
        )}
        {rodape}
      </section>

      <aside className="painel montador-lado">
        {painelMestre}
        <div className="paleta-simbolos">
          {lista.map(s => (
            <button key={s.id} type="button" className={`simbolo-btn ${usados.has(s.id) ? 'usado' : ''}`}
              title={`${s.nome} (${FAMILIA_SINGULAR[s.fam]})`}
              aria-label={`Colocar ${s.nome} em ${nomeDaVaga(vagaSel)}`}
              onPointerDown={e => pressionar(s.id, 'lista', e)}
              onClick={() => colocar(s.id)}>
              <Glifo id={s.id} />
              <span>{s.nome}</span>
            </button>
          ))}
        </div>
      </aside>

      {arrasto && createPortal(
        <div className={`fantasma-simbolo ${arrasto.de !== 'lista' && arrasto.alvo === null && arrasto.fora ? 'fora' : ''}`}
          style={{ transform: `translate(${arrasto.x}px, ${arrasto.y}px)` }}>
          <div><Glifo id={arrasto.id} tamanho={44} /></div>
        </div>,
        document.body,
      )}
    </div>
  );
}
