import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Ficha } from '../types';
import { useDados } from '../store';
import { iniciais, porcentagem, recursoSoDePersonagem } from '../lib/util';

export function CartaoPersonagem({ ficha: f, para, monstro, children }: {
  ficha: Ficha; para?: string; monstro?: boolean; children?: ReactNode;
}) {
  const todos = useDados(s => s.sistema.recursos);
  const recursos = monstro ? todos.filter(r => !recursoSoDePersonagem(r.nome)) : todos;
  return (
    <div className="cartao personagem-cartao">
      <Link className="ficha-cartao" to={para ?? (monstro ? `/monstro/${f.id}` : `/personagem/${f.id}`)}>
        <div className="mini-retrato">{f.retrato ? <img src={f.retrato} alt="" /> : iniciais(f.nome)}</div>
        <div className="ficha-cartao-info">
          <strong>{f.nome}</strong>
          <small>
            {monstro
              ? <>{f.conceito || 'Sem tipo'}{f.altura ? ` · ${f.altura}` : ''} · Ameaça {f.nivel}</>
              : <>{f.jogador || 'Sem jogador'} · {f.conceito || '—'} · Nv {f.nivel}</>}
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
