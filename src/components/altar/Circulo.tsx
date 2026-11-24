import { forwardRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { Selo } from '../../types';
import { ANEIS, GLIFOS, POSICOES } from '../../lib/altarDados';
import { ARTE, circuloDe, simboloEm, SIMBOLO, type Vaga } from '../../lib/altar';

/** Ícone de um símbolo (os traços usam a cor do texto). */
export function Glifo({ id, tamanho = 34 }: { id: string; tamanho?: number }) {
  return (
    <svg className="glifo" viewBox="-1.15 -1.15 2.3 2.3" width={tamanho} height={tamanho} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: GLIFOS[id] ?? '' }} />
  );
}

function GlifoNoDesenho({ id, x, y, escala, classe = '' }: { id: string; x: number; y: number; escala: number; classe?: string }) {
  return (
    <g className={`glifo ${classe}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${escala.toFixed(1)})`}
      dangerouslySetInnerHTML={{ __html: GLIFOS[id] ?? '' }} />
  );
}

interface Props {
  selo: Selo;
  /** só o desenho, pequeno e sem interação (cartões da biblioteca) */
  mini?: boolean;
  /** só o desenho grande, sem os símbolos nem cliques (o Altar põe os símbolos por cima) */
  fundo?: boolean;
  sel?: Vaga | null;
  /** espaço onde o símbolo arrastado vai cair */
  alvo?: Vaga | null;
  /** espaço de onde o símbolo está sendo arrastado */
  erguido?: Vaga | null;
  /** animação de "encaixe" (muda o n a cada novo encaixe) */
  pulso?: { vaga: Vaga; n: number } | null;
  aoClicar?: (v: Vaga) => void;
  aoDuploClique?: (v: Vaga) => void;
  aoPressionar?: (v: Vaga, e: PointerEvent) => void;
}

/** O desenho do círculo com o centro e os nós (o símbolo em cada um). */
export const Circulo = forwardRef<SVGSVGElement, Props>(function Circulo(
  { selo, mini, fundo, sel, alvo, erguido, pulso, aoClicar, aoDuploClique, aoPressionar }, ref,
) {
  const c = circuloDe(selo.circ);
  const pos = POSICOES[c.id];
  const anel = ANEIS[c.id];

  const vaga = (v: Vaga, x: number, y: number, r: number) => {
    const id = simboloEm(selo, v);
    const centro = v === 'c';
    const classes = ['vaga', centro ? 'centro' : 'no', id ? 'cheia' : 'vazia',
      sel === v ? 'sel' : '', alvo === v ? 'alvo' : '', erguido === v ? 'erguido' : ''].join(' ');
    return (
      <g key={String(v)} className={classes} data-vaga={v}
        {...(mini || fundo ? {} : {
          tabIndex: 0,
          role: 'button',
          'aria-label': `${centro ? 'Centro' : `Nó ${Number(v) + 1}`}: ${id ? SIMBOLO[id].nome : 'vazio'}`,
          onClick: () => aoClicar?.(v),
          onDoubleClick: () => aoDuploClique?.(v),
          onPointerDown: (e: PointerEvent) => aoPressionar?.(v, e),
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoClicar?.(v); }
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); aoDuploClique?.(v); }
          },
        })}>
        <circle className="anel" cx={x} cy={y} r={r + 6} />
        <circle className="disco" cx={x} cy={y} r={r} />
        {id && !fundo && <GlifoNoDesenho id={id} x={x} y={y} escala={centro ? 32 : r * 0.8} />}
      </g>
    );
  };

  return (
    <svg ref={ref} className={`circulo-ritual ${mini ? 'mini' : ''} ${fundo ? 'fundo' : ''}`} viewBox="-20 -20 440 440"
      role={mini ? 'img' : 'group'} aria-label={`Círculo ${c.de}`}>
      <image className="circulo-arte" href={ARTE[c.id]} x="0" y="0" width="400" height="400" />
      {anel && (
        <g className="circulo-anel">
          <circle cx={anel[0]} cy={anel[1]} r={anel[2]} strokeWidth="8" />
          <circle cx={anel[0] + 1.6} cy={anel[1] - 1.2} r={anel[2] + 7} strokeWidth="2.2" />
          <circle cx={anel[0] - 1.2} cy={anel[1] + 1} r={anel[2] - 6.5} strokeWidth="1.6" />
        </g>
      )}
      {!mini && pos.map((q, i) => {
        const dx = q[0] - 200, dy = q[1] - 200, d = Math.hypot(dx, dy) || 1, off = q[2] + 14;
        return <text key={i} className="num" x={q[0] + (dx / d) * off} y={q[1] + (dy / d) * off + 4}>{i + 1}</text>;
      })}
      {pos.map((q, i) => vaga(i, q[0], q[1], q[2]))}
      {vaga('c', 200, 200, 43)}
      {pulso && (() => {
        const q = pulso.vaga === 'c' ? [200, 200, 43] : pos[pulso.vaga];
        if (!q) return null;
        return (
          <g key={pulso.n} className="ondas">
            <circle className="onda" cx={q[0]} cy={q[1]} r={q[2] + 4} />
            <circle className="onda o2" cx={q[0]} cy={q[1]} r={q[2] + 4} />
          </g>
        );
      })()}
    </svg>
  );
});
