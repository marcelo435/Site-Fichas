import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { acoes, useDados } from '../store';
import { NaoEncontrado } from '../components/NaoEncontrado';
import { CartaoPersonagem } from '../components/CartaoPersonagem';
import { MesaForm } from './Mesas';
import { importarFichaDeArquivo } from '../lib/importarFicha';
import { useTitulo } from '../lib/useTitulo';
import { codigoDaMesa, copiar, linkDaMesa } from '../lib/convite';
import type { Mesa as TMesa } from '../types';

/** Janela com o código e o link do convite (demonstração). */
function ConviteMesa({ mesa, aoFechar }: { mesa: TMesa; aoFechar: () => void }) {
  const navigate = useNavigate();
  const codigo = codigoDaMesa(mesa.id);
  const link = linkDaMesa(mesa.id);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aoFechar]);
  const mensagem = `Entra na minha mesa "${mesa.nome}" no Abismio! Abre o link e escolhe o seu personagem: ${link} (ou usa o código ${codigo})`;

  return (
    <div className="modal" onMouseDown={e => e.target === e.currentTarget && aoFechar()}>
      <div className="modal-caixa convite-caixa" role="dialog" aria-modal="true" aria-labelledby="titulo-convite">
        <h2 id="titulo-convite">Convidar jogadores</h2>
        <p className="sub">Mande o código ou o link para cada jogador. Ele abre, escolhe o personagem dele e entra nesta mesa.</p>

        <div className="convite-codigo">
          <span>Código da mesa</span>
          <strong>{codigo}</strong>
          <button type="button" className="btn mini" onClick={() => copiar(codigo, 'Código copiado.')}>Copiar código</button>
        </div>

        <label className="campo">
          Link do convite
          <div className="linha-copiar">
            <input readOnly value={link} onFocus={e => e.target.select()} />
            <button type="button" className="btn" onClick={() => copiar(link, 'Link copiado.')}>Copiar link</button>
          </div>
        </label>

        <div className="acoes-ritual">
          <button type="button" className="btn" onClick={() => copiar(mensagem, 'Mensagem copiada. É só colar no WhatsApp ou no Discord.')}>
            Copiar mensagem pronta
          </button>
          <button type="button" className="btn" onClick={() => { aoFechar(); navigate(`/entrar/${codigo}`); }}>
            Ver como o jogador vê
          </button>
        </div>

        <div className="aviso-demo">
          <strong>Demonstração.</strong> O site ainda não tem servidor, então o convite só funciona neste navegador.
          Quando tiver, o mesmo código vai valer para os jogadores em outros computadores.
        </div>

        <div className="modal-acoes">
          <button type="button" className="btn primario" onClick={aoFechar}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export function Mesa() {
  const { mesaId = '' } = useParams();
  const mesa = useDados(s => s.mesas.find(m => m.id === mesaId));
  const todos = useDados(s => s.personagens);
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [escolhido, setEscolhido] = useState('');
  const [convidando, setConvidando] = useState(false);
  useTitulo(mesa?.nome ?? 'Mesa');

  if (!mesa) return <NaoEncontrado msg="Mesa não encontrada." />;

  const naMesa = mesa.personagens.map(id => todos.find(f => f.id === id)).filter(f => f !== undefined);
  const foraDaMesa = todos.filter(f => !mesa.personagens.includes(f.id)).sort((a, b) => a.nome.localeCompare(b.nome));
  const selecionado = foraDaMesa.some(f => f.id === escolhido) ? escolhido : foraDaMesa[0]?.id ?? '';

  return (
    <>
      <div className="migalhas">
        <Link to="/mesas">Mesas</Link> › <span>{mesa.nome}</span>
      </div>
      <div className="cabecalho">
        <div>
          <h1>{mesa.nome}</h1>
          {mesa.descricao && <p className="sub">{mesa.descricao}</p>}
        </div>
        <div className="acoes">
          <button className="btn" onClick={() => setConvidando(true)}>Convidar jogadores</button>
          <button className="btn" onClick={() => setEditando(true)}>Editar mesa</button>
          <button className="btn" onClick={() => importarFichaDeArquivo(mesa.id)}>Importar ficha</button>
          <button className="btn primario" onClick={() => navigate(`/personagem/${acoes().criarPersonagem(mesa.id)}?mesa=${mesa.id}`)}>
            + Novo personagem
          </button>
        </div>
      </div>

      {foraDaMesa.length > 0 && (
        <div className="filtros painel">
          <select value={selecionado} onChange={e => setEscolhido(e.target.value)}>
            {foraDaMesa.map(f => (
              <option key={f.id} value={f.id}>{f.nome}{f.jogador ? ` (${f.jogador})` : ''}</option>
            ))}
          </select>
          <button className="btn" onClick={() => acoes().vincular(mesa.id, selecionado)}>Adicionar personagem existente</button>
        </div>
      )}

      {naMesa.length === 0 ? (
        <div className="vazio painel">
          <p>Essa mesa ainda não tem personagens. Crie um novo ou adicione um que já existe.</p>
        </div>
      ) : (
        <div className="grade">
          {naMesa.map(f => (
            <CartaoPersonagem key={f.id} ficha={f} para={`/personagem/${f.id}?mesa=${mesa.id}`}>
              <button className="btn mini" onClick={() => acoes().desvincular(mesa.id, f.id)}
                title="Tira da mesa, mas o personagem continua existindo">
                Tirar da mesa
              </button>
            </CartaoPersonagem>
          ))}
        </div>
      )}

      {editando && <MesaForm mesa={mesa} aoFechar={() => setEditando(false)} />}
      {convidando && <ConviteMesa mesa={mesa} aoFechar={() => setConvidando(false)} />}
    </>
  );
}
