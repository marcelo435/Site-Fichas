import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Ficha } from '../types';
import { useDados } from '../store';
import { iniciais, porcentagem } from '../lib/util';

export function CartaoPersonagem({ ficha: f, para, children }: { ficha: Ficha; para?: string; children?: ReactNode }) {
  const recursos = useDados(s => s.sistema.recursos);
  return (
    <div className="cartao personagem-cartao">
      <Link className="ficha-cartao" to={para ?? `/personagem/${f.id}`}>
        <div className="mini-retrato">{f.retrato ? <img src={f.retrato} alt="" /> : iniciais(f.nome)}</div>
        <div className="ficha-cartao-info">
          <strong>{f.nome}</strong>
          <small>
            {f.jogador || 'Sem jogador'} · {f.conceito || '—'} · Nv {f.nivel}
          </small>
          {recursos.map(r => {
            const v = f.recursos[r.nome] ?? { atual: 0, max: 0 };
            return (
              <div key={r.nome} className="mini-barra">
                <div style={{ width: `${porcentagem(v.atual, v.max)}%`, background: r.cor }} />
                <span>{r.nome} {v.atual}/{v.max}</span>
              </div>
            );
          })}
        </div>
      </Link>
      {children && <div className="cartao-acoes">{children}</div>}
    </div>
  );
}
