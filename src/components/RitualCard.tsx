import type { CSSProperties, ReactNode } from 'react';
import type { Ritual } from '../types';
import { useDados } from '../store';
import { corElemento } from '../lib/util';
import { Markdown } from './Markdown';
import { Circulo } from './altar/Circulo';
import { circuloDe } from '../lib/altar';

export function RitualCard({ ritual: r, children }: { ritual: Ritual; children?: ReactNode }) {
  const elementos = useDados(s => s.sistema.elementos);
  const stats = ([
    ['Execução', r.execucao],
    ['Alcance', r.alcance],
    ['Alvo', r.alvo],
    ['Duração', r.duracao],
    ['Resistência', r.resistencia],
  ] as const).filter(([, v]) => v);

  return (
    <details className="ritual" style={{ '--cor-elemento': corElemento(r.elemento, elementos) } as CSSProperties}>
      <summary>
        <span className="ritual-nome">{r.nome || 'Sem nome'}</span>
        {r.elemento && <span className="tag elemento">{r.elemento}</span>}
        <span className="tag">{r.selo ? `Círculo ${circuloDe(r.selo.circ).de}` : `${r.circulo}º círculo`}</span>
        {r.custo && <span className="tag">{r.custo}</span>}
      </summary>
      {r.selo && <div className="ritual-selo"><Circulo selo={r.selo} mini /></div>}
      {stats.length > 0 && (
        <dl className="ritual-stats">
          {stats.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      )}
      <Markdown texto={r.descricao} vazio="Sem descrição." />
      {children && <div className="ritual-acoes">{children}</div>}
    </details>
  );
}
