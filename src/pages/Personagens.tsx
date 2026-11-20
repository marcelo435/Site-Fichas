import { useState } from 'react';
import { useNavigate } from 'react-router';
import { acoes, useDados } from '../store';
import { CartaoPersonagem } from '../components/CartaoPersonagem';
import { importarFichaDeArquivo } from '../lib/importarFicha';
import { useTitulo } from '../lib/useTitulo';

export function Personagens() {
  useTitulo('Personagens');
  const navigate = useNavigate();
  const personagens = useDados(s => s.personagens);
  const mesas = useDados(s => s.mesas);
  const [busca, setBusca] = useState('');

  const termo = busca.trim().toLowerCase();
  const lista = personagens
    .filter(f => !termo || `${f.nome} ${f.jogador} ${f.conceito}`.toLowerCase().includes(termo))
    .sort((a, b) => b.atualizadaEm - a.atualizadaEm);

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Personagens</h1>
          <p className="sub">Crie seus personagens aqui. Se quiser, depois coloque eles numa mesa.</p>
        </div>
        <div className="acoes">
          <button className="btn" onClick={async () => {
            const id = await importarFichaDeArquivo();
            if (id) navigate(`/personagem/${id}`);
          }}>Importar ficha</button>
          <button className="btn primario" onClick={() => navigate(`/personagem/${acoes().criarPersonagem()}`)}>
            + Novo personagem
          </button>
        </div>
      </div>

      {personagens.length > 0 && (
        <div className="filtros painel">
          <input placeholder="Buscar por nome, jogador ou classe..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      )}

      {personagens.length === 0 ? (
        <div className="vazio painel">
          <p>Nenhum personagem ainda. Clique em “+ Novo personagem” para criar a primeira ficha.</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="vazio painel"><p>Nenhum personagem encontrado.</p></div>
      ) : (
        <div className="grade">
          {lista.map(f => {
            const emMesas = mesas.filter(m => m.personagens.includes(f.id));
            return (
              <CartaoPersonagem key={f.id} ficha={f}>
                <small className="mesas-do-personagem">
                  {emMesas.length ? `Mesa: ${emMesas.map(m => m.nome).join(', ')}` : 'Sem mesa'}
                </small>
              </CartaoPersonagem>
            );
          })}
        </div>
      )}
    </>
  );
}
