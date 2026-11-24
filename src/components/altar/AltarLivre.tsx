import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { Selo } from '../../types';
import { CIRCULOS, POSICOES, SIMBOLOS } from '../../lib/altarDados';
import { leitura, porEm, SIMBOLO, simboloEm, trocarCirculo, seloVazio, type Vaga } from '../../lib/altar';
import { Circulo, Glifo } from './Circulo';

/*
 * O altar dos jogadores: o círculo no meio e os 40 símbolos soltos em volta, flutuando.
 * Não tem lista nem significado: o jogador arrasta um símbolo até o desenho e vê o que o círculo lê.
 */

interface Geo { W: number; H: number; barra: number; base: number; tam: number; esq: number; topo: number; runa: number }
interface Ponto { x: number; y: number }
interface Lugar extends Ponto { v: Vaga; r: number }
interface Arrasto extends Ponto { id: string; de: Vaga | null; ox: number; oy: number; sx: number; sy: number; moveu: boolean; alvo: Lugar | null }
interface Particula { x: number; y: number; vx: number; vy: number; vida: number; some: number; tam: number; forte: boolean }
interface Onda { x: number; y: number; r: number; max: number; vida: number; fina?: boolean }
interface Poeira { x: number; y: number; vy: number; fase: number; tam: number }

const ALTURA_LEITURA = 100;

function calcularGeo(W: number, H: number, barra: number): Geo {
  const espaco = H - barra - ALTURA_LEITURA - 16;
  const largo = W > H * 1.15;
  const tam = Math.max(200, Math.min(largo ? espaco : Math.min(W * 0.86, espaco * 0.62), 600));
  const meio = barra + (H - barra - ALTURA_LEITURA) / 2;
  return { W, H, barra, base: ALTURA_LEITURA, tam, esq: (W - tam) / 2, topo: meio - tam / 2, runa: W < 560 ? 38 : 50 };
}

function lugaresDoCirculo(g: Geo, circ: string): Lugar[] {
  const k = g.tam / 440;
  const nos: Lugar[] = (POSICOES[circ] ?? []).map((q, i) => ({ v: i, x: g.esq + (q[0] + 20) * k, y: g.topo + (q[1] + 20) * k, r: q[2] * k }));
  return [...nos, { v: 'c', x: g.esq + 220 * k, y: g.topo + 220 * k, r: 43 * k }];
}

const centroDoCirculo = (g: Geo): Ponto => ({ x: g.esq + g.tam / 2, y: g.topo + g.tam / 2 });
const dentroDoCirculo = (g: Geo, p: Ponto) => {
  const c = centroDoCirculo(g);
  return Math.hypot(p.x - c.x, p.y - c.y) < g.tam / 2 + g.runa * 0.4;
};

/** Um lugar vazio na tela, fora do círculo e longe dos outros símbolos. */
function lugarLivre(g: Geo, evitar: Ponto[]): Ponto {
  const pad = g.runa * 0.6;
  const alto = g.H - g.barra - g.base - 2 * pad;
  for (let t = 0; t < 400; t++) {
    const folga = t < 250 ? g.runa * 1.15 : g.runa * 0.75;
    const p = { x: pad + Math.random() * (g.W - 2 * pad), y: g.barra + pad + Math.random() * alto };
    if (dentroDoCirculo(g, p)) continue;
    if (evitar.some(o => Math.hypot(o.x - p.x, o.y - p.y) < folga)) continue;
    return p;
  }
  return { x: pad + Math.random() * (g.W - 2 * pad), y: g.H - g.base - pad };
}

function lugarMaisPerto(lugares: Lugar[], x: number, y: number): Lugar | null {
  let melhor: Lugar | null = null;
  let menor = Infinity;
  for (const z of lugares) {
    const d = Math.hypot(z.x - x, z.y - y);
    if (d < z.r * 1.5 + 8 && d < menor) { menor = d; melhor = z; }
  }
  return melhor;
}

const vagaDe = (selo: Selo, id: string): Vaga | null => {
  if (selo.centro === id) return 'c';
  const i = selo.nos.indexOf(id);
  return i >= 0 ? i : null;
};

interface Props {
  selo: Selo;
  mudar: (s: Selo) => void;
  /** botão "Mestre" da barra (abre o grimório) */
  aoMestre?: () => void;
}

export function AltarLivre({ selo, mudar, aoMestre }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const barraRef = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const circuloRef = useRef<HTMLDivElement>(null);
  const [g, setG] = useState<Geo | null>(null);
  /** posição dos símbolos soltos, em fração da largura e da altura (assim acompanham o tamanho da tela) */
  const [livres, setLivres] = useState<Record<string, { fx: number; fy: number }>>({});
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const [dica, setDica] = useState<string | null>(null);
  const [lido, setLido] = useState(0);

  const arrastoRef = useRef<Arrasto | null>(null);
  const timerDica = useRef(0);
  const efeitos = useRef({ particulas: [] as Particula[], ondas: [] as Onda[], poeira: [] as Poeira[] });
  const calmo = useRef(typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- tamanho ----------
  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => setG(calcularGeo(el.clientWidth, el.clientHeight, (barraRef.current?.offsetHeight ?? 50) + 10));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (barraRef.current) ro.observe(barraRef.current);
    return () => ro.disconnect();
  }, []);

  const lugares = g ? lugaresDoCirculo(g, selo.circ) : [];

  // ---------- espalhar quem está solto sem lugar (ou caiu dentro do círculo depois de mudar o tamanho) ----------
  useLayoutEffect(() => {
    if (!g) return;
    const sentados = new Set([selo.centro, ...selo.nos].filter((x): x is string => !!x));
    const novo = { ...livres };
    let mudou = false;
    for (const id of Object.keys(novo)) if (sentados.has(id)) { delete novo[id]; mudou = true; }
    const evitar: Ponto[] = [
      ...lugaresDoCirculo(g, selo.circ),
      ...Object.values(novo).map(p => ({ x: p.fx * g.W, y: p.fy * g.H })),
    ];
    for (const s of SIMBOLOS) {
      if (sentados.has(s.id) || arrasto?.id === s.id) continue;
      const p = novo[s.id];
      if (p && !dentroDoCirculo(g, { x: p.fx * g.W, y: p.fy * g.H })) continue;
      const q = lugarLivre(g, evitar);
      evitar.push(q);
      novo[s.id] = { fx: q.x / g.W, fy: q.y / g.H };
      mudou = true;
    }
    if (mudou) setLivres(novo);
  }, [g, selo, livres, arrasto]);

  // ---------- efeitos (brasas, ondas e poeira no ar) ----------
  const explodir = (x: number, y: number, forca: number) => {
    const { particulas, ondas } = efeitos.current;
    const n = calmo.current ? 10 : Math.round(46 * forca);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (1.5 + Math.random() * 4.5) * forca;
      particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, vida: 1, some: 0.012 + Math.random() * 0.02, tam: 1 + Math.random() * 2.6, forte: Math.random() < 0.55 });
    }
    ondas.push({ x, y, r: 6, max: 70 * forca, vida: 1 });
    if (!calmo.current) ondas.push({ x, y, r: 2, max: 40 * forca, vida: 1, fina: true });
    const el = circuloRef.current;
    if (el) { el.classList.remove('pulso'); void el.offsetWidth; el.classList.add('pulso'); }
  };
  const zumbir = (x: number, y: number) => {
    if (calmo.current) return;
    for (let i = 0; i < 2; i++) {
      efeitos.current.particulas.push({ x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random(), vida: 0.8, some: 0.03, tam: 1 + Math.random() * 1.5, forte: true });
    }
  };

  useEffect(() => {
    const cv = tela.current;
    if (!cv || !g) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    cv.width = g.W * d; cv.height = g.H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const fx = efeitos.current;
    fx.poeira = calmo.current ? [] : Array.from({ length: Math.round(Math.min(46, (g.W * g.H) / 22000)) }, () => ({
      x: Math.random() * g.W, y: Math.random() * g.H, vy: 0.08 + Math.random() * 0.25, fase: Math.random() * 6.3, tam: 0.6 + Math.random() * 1.2,
    }));
    let raf = 0;
    const quadro = () => {
      ctx.clearRect(0, 0, g.W, g.H);
      for (const m of fx.poeira) {
        m.y -= m.vy; m.fase += 0.01;
        if (m.y < -5) { m.y = g.H + 5; m.x = Math.random() * g.W; }
        ctx.globalAlpha = 0.16 + 0.12 * Math.sin(m.fase);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(m.x + Math.sin(m.fase) * 6, m.y, m.tam, 0, 6.283); ctx.fill();
      }
      fx.particulas = fx.particulas.filter(p => p.vida > 0);
      for (const p of fx.particulas) {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy = p.vy * 0.96 - 0.03; p.vida -= p.some;
        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.fillStyle = p.forte ? '#fff' : '#9a9aa2';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.tam, 0, 6.283); ctx.fill();
      }
      fx.ondas = fx.ondas.filter(o => o.vida > 0);
      for (const o of fx.ondas) {
        o.r += (o.max - o.r) * 0.12; o.vida -= 0.03;
        ctx.globalAlpha = Math.max(0, o.vida) * 0.9;
        ctx.strokeStyle = o.fina ? '#9a9aa2' : '#fff';
        ctx.lineWidth = o.fina ? 1 : 2.5;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.283); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(raf);
  }, [g]);

  useEffect(() => {
    document.body.classList.toggle('arrastando-simbolo', !!arrasto);
    return () => document.body.classList.remove('arrastando-simbolo');
  }, [arrasto]);

  useEffect(() => () => clearTimeout(timerDica.current), []);

  const mostrarDica = (id: string | null, depois = 0) => {
    clearTimeout(timerDica.current);
    if (depois) timerDica.current = window.setTimeout(() => setDica(id), depois);
    else setDica(id);
  };

  // ---------- posição de cada símbolo ----------
  const posicao = (id: string): { p: Ponto; tam: number; vaga: Vaga | null; oculto: boolean } => {
    if (!g) return { p: { x: 0, y: 0 }, tam: 0, vaga: null, oculto: true };
    if (arrasto?.id === id) return { p: arrasto, tam: g.runa, vaga: null, oculto: false };
    const v = vagaDe(selo, id);
    if (v !== null) {
      const z = lugares.find(l => l.v === v);
      if (z) return { p: z, tam: v === 'c' ? z.r * 1.45 : z.r * 1.62, vaga: v, oculto: false };
    }
    const l = livres[id];
    // quem ainda não tem lugar sai do meio do círculo
    return l ? { p: { x: l.fx * g.W, y: l.fy * g.H }, tam: g.runa, vaga: null, oculto: false }
      : { p: centroDoCirculo(g), tam: g.runa, vaga: null, oculto: true };
  };

  // ---------- arrastar ----------
  const noPonto = (e: PointerEvent): Ponto => {
    const r = caixa.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pegar = (id: string, e: PointerEvent<HTMLDivElement>) => {
    if (e.button > 0 || !g) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ponteiro já solto */ }
    e.currentTarget.focus({ preventScroll: true });
    const { p } = posicao(id);
    const m = noPonto(e);
    const a: Arrasto = { id, de: vagaDe(selo, id), x: p.x, y: p.y, ox: p.x - m.x, oy: p.y - m.y, sx: m.x, sy: m.y, moveu: false, alvo: null };
    arrastoRef.current = a;
    setArrasto(a);
    mostrarDica(id);
    zumbir(p.x, p.y);
  };

  const mover = (e: PointerEvent) => {
    const a = arrastoRef.current;
    if (!a || !g) return;
    const m = noPonto(e);
    const x = Math.max(10, Math.min(g.W - 10, m.x + a.ox));
    const y = Math.max(10, Math.min(g.H - 10, m.y + a.oy));
    const novo = { ...a, x, y, moveu: a.moveu || Math.hypot(m.x - a.sx, m.y - a.sy) > 4, alvo: lugarMaisPerto(lugares, x, y) };
    arrastoRef.current = novo;
    setArrasto(novo);
    if (Math.random() < 0.35) zumbir(x, y);
  };

  const soltar = () => {
    const a = arrastoRef.current;
    if (!a || !g) return;
    arrastoRef.current = null;
    setArrasto(null);
    mostrarDica(null, a.moveu ? 300 : 2200);
    const z = lugarMaisPerto(lugares, a.x, a.y);
    let s = a.de !== null ? porEm(selo, a.de, null) : selo;
    if (z) {
      const ocupante = simboloEm(s, z.v);
      s = porEm(s, z.v, a.id);
      // quem estava lá troca de lugar com ele (ou volta a flutuar, se ele veio de fora)
      if (ocupante && ocupante !== a.id && a.de !== null) s = porEm(s, a.de, ocupante);
      if (a.moveu || a.de !== z.v) { explodir(z.x, z.y, z.v === 'c' ? 1.6 : 1); setLido(n => n + 1); }
    } else {
      setLivres(l => ({ ...l, [a.id]: { fx: a.x / g.W, fy: a.y / g.H } }));
    }
    mudar(s);
  };

  const teclado = (id: string, e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const v = vagaDe(selo, id);
    if (v !== null) { mudar(porEm(selo, v, null)); return; }
    const alvo: Vaga | -1 = !selo.centro ? 'c' : selo.nos.findIndex(n => !n);
    if (alvo === -1) return;
    mudar(porEm(selo, alvo, id));
    const z = lugares.find(l => l.v === alvo);
    if (z) explodir(z.x, z.y, alvo === 'c' ? 1.6 : 1);
    setLido(n => n + 1);
    mostrarDica(id);
    mostrarDica(null, 2200);
  };

  const trocar = (circ: string) => {
    if (circ === selo.circ) return;
    mudar(trocarCirculo(selo, circ));
    if (g) explodir(g.esq + g.tam / 2, g.topo + g.tam / 2, 1.3);
    setLido(n => n + 1);
  };

  const l = leitura(selo);
  const sDica = dica ? SIMBOLO[dica] : null;

  return (
    <div ref={caixa} className="altar-livre">
      <div ref={barraRef} className="altar-barra">
        <div className="chips-circulo" role="group" aria-label="Círculo">
          {CIRCULOS.map(x => (
            <button key={x.id} className={`filtro ${x.id === selo.circ ? 'ativo' : ''}`} aria-pressed={x.id === selo.circ} onClick={() => trocar(x.id)}>
              {x.nome}
            </button>
          ))}
        </div>
        <div className="chips-circulo">
          <button className="filtro" onClick={() => setLivres({})}>Espalhar</button>
          <button className="filtro" onClick={() => { setLivres({}); mudar(seloVazio(selo.circ)); }}>Desfazer ritual</button>
          {aoMestre && <button className="filtro tracejado" onClick={aoMestre}>Mestre</button>}
        </div>
      </div>

      {g && (
        <div ref={circuloRef} className={`altar-circulo ${selo.centro ? 'desperto' : ''}`}
          style={{ left: g.esq, top: g.topo, width: g.tam, height: g.tam }}>
          <Circulo selo={selo} fundo alvo={arrasto?.alvo?.v ?? null} erguido={arrasto?.de ?? null} />
        </div>
      )}

      <canvas ref={tela} className="altar-efeitos" aria-hidden="true" />

      {g && SIMBOLOS.map((s, i) => {
        const { p, tam, vaga, oculto } = posicao(s.id);
        const pegando = arrasto?.id === s.id;
        const classes = ['runa', pegando ? 'pegando' : '', vaga !== null ? 'sentada' : '', vaga === 'c' ? 'no-centro' : vaga !== null ? 'no-no' : '', oculto ? 'oculta' : ''].join(' ');
        return (
          <div key={s.id} className={classes} tabIndex={0} role="button"
            aria-label={vaga === null ? s.nome : `${s.nome}, ${vaga === 'c' ? 'no centro' : `no nó ${vaga + 1}`}`}
            style={{
              '--pos': `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`,
              '--s': `${tam.toFixed(1)}px`,
              '--d': `${(-(i * 0.37) % 6).toFixed(2)}s`,
            } as CSSProperties}
            onPointerDown={e => pegar(s.id, e)} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
            onKeyDown={e => teclado(s.id, e)}>
            <Glifo id={s.id} tamanho={100} />
          </div>
        );
      })}

      <div className={`altar-dica ${sDica ? 'on' : ''}`} style={{ top: g ? g.barra + 2 : 60 }} aria-live="polite">
        {sDica && <><b>{sDica.nome}</b><span>{sDica.ess}</span></>}
      </div>

      <div className="altar-leitura" aria-live="polite">
        <div className="rotulo">O círculo lê</div>
        <p key={lido} className={l.texto ? 'viva' : ''}>{l.texto || 'Arraste um símbolo até o centro do círculo.'}</p>
        {l.fusoes.length > 0 && <small>{l.fusoes.map(f => `${SIMBOLO[f.a].nome} + ${SIMBOLO[f.b].nome} = ${f.nome}`).join(' · ')}</small>}
      </div>
    </div>
  );
}
