import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Mesa } from '../types';
import { acoes, useDados } from '../store';
import { Modal } from '../components/Modal';
import { iniciais } from '../lib/util';
import { useTitulo } from '../lib/useTitulo';

export function MesaForm({ mesa, aoFechar }: { mesa?: Mesa; aoFechar: () => void }) {
  const navigate = useNavigate();
  const [nome, setNome] = useState(mesa?.nome ?? '');
  const [descricao, setDescricao] = useState(mesa?.descricao ?? '');

  return (
    <Modal
      titulo={mesa ? 'Editar mesa' : 'Nova mesa'}
      aoFechar={aoFechar}
      aoSalvar={() => {
        if (mesa) {
          acoes().editarMesa(mesa.id, { nome, descricao });
        } else {
          const id = acoes().criarMesa(nome, descricao);
          navigate(`/mesa/${id}`);
        }
        aoFechar();
      }}
    >
      <label className="campo">
        Nome da mesa
        <input required autoFocus value={nome} onChange={e => setNome(e.target.value)} />
      </label>
      <label className="campo">
        Descrição / notas do mestre
        <textarea rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} />
      </label>
    </Modal>
  );
}

export function Mesas() {
  useTitulo('Mesas');
  const mesas = useDados(s => s.mesas);
  const personagens = useDados(s => s.personagens);
  const [form, setForm] = useState<{ mesa?: Mesa } | null>(null);

  return (
    <>
      <div className="cabecalho">
        <h1>Mesas</h1>
        <div className="acoes">
          <Link to="/entrar" className="btn">Entrar com código</Link>
          <button className="btn primario" onClick={() => setForm({})}>+ Nova mesa</button>
        </div>
      </div>

      {mesas.length === 0 ? (
        <div className="vazio painel">
          <p>Nenhuma mesa ainda. Uma mesa junta os personagens de uma campanha. Crie uma e adicione os personagens dos jogadores.</p>
        </div>
      ) : (
        <div className="grade">
          {mesas.map(m => {
            const fichas = m.personagens.map(id => personagens.find(f => f.id === id)).filter(f => f !== undefined);
            return (
            <div key={m.id} className="cartao mesa-cartao">
              <Link to={`/mesa/${m.id}`} className="mesa-link">
                <h2>{m.nome}</h2>
                <p>{m.descricao || 'Sem descrição'}</p>
                <div className="avatares">
                  {fichas.slice(0, 6).map(f => (
                    <span key={f.id} className="avatar" title={f.nome}>
                      {f.retrato ? <img src={f.retrato} alt="" /> : iniciais(f.nome)}
                    </span>
                  ))}
                  <small>{fichas.length} personage{fichas.length === 1 ? 'm' : 'ns'}</small>
                </div>
              </Link>
              <div className="cartao-acoes">
                <button className="btn mini" onClick={() => setForm({ mesa: m })}>Editar</button>
                <button
                  className="btn mini perigo"
                  onClick={() => {
                    if (confirm(`Excluir a mesa "${m.nome}"?\nOs personagens NÃO são apagados, continuam na aba Personagens.`)) {
                      acoes().excluirMesa(m.id);
                    }
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {form && <MesaForm mesa={form.mesa} aoFechar={() => setForm(null)} />}
    </>
  );
}
