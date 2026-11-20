import { useId, type CSSProperties, type ReactNode } from 'react';
import { infoAtributo, useDados } from '../store';
import abismoUrl from '../assets/simbolos/abismo.png';
import forcaUrl from '../assets/simbolos/forca.png';
import fortitudeUrl from '../assets/simbolos/fortitude.png';
import inteligenciaUrl from '../assets/simbolos/inteligencia.png';

/*
 * Símbolos dos elementos do Abismo.
 * - Os padrões são imagens recortadas (máscaras) pintadas com a cor do elemento,
 *   ou desenhos SVG para quem ainda não tem imagem.
 * - Em Sistema → Símbolos dá para trocar cada um por outra imagem.
 */

const polar = (r: number, a: number) => [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
const pts = (lista: (readonly [number, number])[]) => lista.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

const DESENHOS: Record<string, ReactNode> = {
  pentagrama: (
    <g fill="none" strokeLinejoin="round">
      <circle cx="50" cy="50" r="45" strokeWidth="3.2" />
      <circle cx="50" cy="50" r="40.5" strokeWidth="1.2" />
      <polygon
        points={pts([0, 2, 4, 1, 3].map(k => polar(42.5, -Math.PI / 2 + (k * Math.PI * 2) / 5)))}
        strokeWidth="3.2"
      />
    </g>
  ),
  espiral: (
    <g fill="none" strokeLinecap="round">
      {Array.from({ length: 14 }, (_, k) => {
        const lista: (readonly [number, number])[] = [];
        const base = (k / 14) * Math.PI * 2;
        for (let t = 0; t <= 1.0001; t += 0.04) lista.push(polar(3 + t * 44, base + t * Math.PI * 2.4));
        return <polyline key={k} points={pts(lista)} strokeWidth={k % 2 ? 1 : 1.8} opacity={k % 3 ? 0.75 : 1} />;
      })}
    </g>
  ),
  olho: (
    <g fill="none" strokeLinecap="round">
      <path d="M50 4 Q66 50 50 96 Q34 50 50 4Z" strokeWidth="3" />
      <path d="M6 50 Q50 30 94 50 Q50 70 6 50Z" strokeWidth="3" />
      <circle cx="50" cy="50" r="10" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="3.2" fill="currentColor" stroke="none" />
    </g>
  ),
};

/** Imagens padrão (máscaras) por nome de atributo, sem acento e minúsculo. */
const IMAGENS: Record<string, string> = {
  abismo: abismoUrl,
  forca: forcaUrl,
  fortitude: fortitudeUrl,
  inteligencia: inteligenciaUrl,
};
const DESENHO_POR_NOME: Record<string, string> = { destreza: 'pentagrama' };
const RESERVA = ['pentagrama', 'olho', 'espiral'];

const chave = (nome: string) => nome.normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase();

function Desenho({ tipo }: { tipo: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" className="simbolo-svg" aria-hidden="true">
      <defs>
        {/* traço levemente irregular, como desenhado à mão */}
        <filter id={`risco-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.8" />
        </filter>
      </defs>
      <g stroke="currentColor" filter={`url(#risco-${id})`}>{DESENHOS[tipo]}</g>
    </svg>
  );
}

function Mascara({ url }: { url: string }) {
  const m = `url("${url}")`;
  return <span className="simbolo-mascara" style={{ maskImage: m, WebkitMaskImage: m }} />;
}

function Simbolo({ cor, titulo, children }: { cor: string; titulo: string; children: ReactNode }) {
  return (
    <span className="simbolo" style={{ '--cor': cor } as CSSProperties} role="img" aria-label={titulo}>
      {children}
    </span>
  );
}

/** Símbolo do elemento ligado a um atributo, pintado com a cor dele. */
export function SimboloAtributo({ nome }: { nome: string }) {
  const sistema = useDados(s => s.sistema);
  const info = infoAtributo(sistema, nome);
  const k = chave(nome);
  let conteudo: ReactNode;
  if (info.simbolo) {
    conteudo = info.mascara ? <Mascara url={info.simbolo} /> : <img className="simbolo-img" src={info.simbolo} alt="" />;
  } else if (IMAGENS[k]) {
    conteudo = <Mascara url={IMAGENS[k]} />;
  } else {
    const i = Math.max(0, sistema.atributos.indexOf(nome));
    conteudo = <Desenho tipo={DESENHO_POR_NOME[k] ?? RESERVA[i % RESERVA.length]} />;
  }
  return <Simbolo cor={info.cor} titulo={nome}>{conteudo}</Simbolo>;
}

/** Símbolo do centro do pentágono (o Abismo). */
export function SimboloCentro() {
  const img = useDados(s => s.sistema.simboloCentro);
  const mascara = useDados(s => s.sistema.simboloCentroMascara);
  let conteudo: ReactNode = <Desenho tipo="espiral" />;
  if (img) conteudo = mascara ? <Mascara url={img} /> : <img className="simbolo-img" src={img} alt="" />;
  return <Simbolo cor="#ededf0" titulo="Abismo">{conteudo}</Simbolo>;
}
