import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { acoes, useDados } from '../store';
import { NaoEncontrado } from '../components/NaoEncontrado';
import { CartaoPersonagem } from '../components/CartaoPersonagem';
import { MesaForm } from './Mesas';
import { importarFichaDeArquivo } from '../lib/importarFicha';
import { useTitulo } from '../lib/useTitulo';

export function Mesa() {
  const { mesaId = '' } = useParams();
  const mesa = useDados(s => s.mesas.find(m => m.id === mesaId));
  const todos = useDados(s => s.personagens);
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [escolhido, setEscolhido] = useState('');
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
    </>
  );
}
