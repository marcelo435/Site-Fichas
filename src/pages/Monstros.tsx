import { useState } from 'react';
import { useNavigate } from 'react-router';
import { acoes, useDados } from '../store';
import { CartaoPersonagem } from '../components/CartaoPersonagem';
import { importarMonstroDeArquivo } from '../lib/importarFicha';
import { useTitulo } from '../lib/useTitulo';

/** Lista dos monstros do mestre. Mesma ideia da aba Personagens, mas sem mesas. */
export function Monstros() {
  useTitulo('Monstros');
  const navigate = useNavigate();
  const monstros = useDados(s => s.monstros);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');

  const tipos = [...new Set(monstros.map(m => m.conceito.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const termo = busca.trim().toLowerCase();
  const lista = monstros
    .filter(m => !tipo || m.conceito.trim() === tipo)
    .filter(m => !termo || `${m.nome} ${m.conceito} ${m.altura}`.toLowerCase().includes(termo))
    .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome));

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Monstros</h1>
          <p className="sub">As criaturas do mestre. Cada uma tem a mesma ficha dos personagens, com o que importa para um monstro.</p>
        </div>
        <div className="acoes">
          <button className="btn" onClick={async () => {
            const id = await importarMonstroDeArquivo();
            if (id) navigate(`/monstro/${id}`);
          }}>Importar monstro</button>
          <button className="btn primario" onClick={() => navigate(`/monstro/${acoes().criarMonstro()}`)}>
            + Novo monstro
          </button>
        </div>
      </div>

      {monstros.length > 0 && (
        <div className="filtros painel">
          <input placeholder="Buscar por nome, tipo ou tamanho..." value={busca} onChange={e => setBusca(e.target.value)} />
          {tipos.length > 0 && (
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {tipos.map(t => <option key={t}>{t}</option>)}
            </select>
          )}
        </div>
      )}

      {monstros.length === 0 ? (
        <div className="vazio painel">
          <p>Nenhum monstro ainda. Clique em “+ Novo monstro” para criar a primeira criatura.</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="vazio painel"><p>Nenhum monstro encontrado.</p></div>
      ) : (
        <div className="grade">
          {lista.map(m => <CartaoPersonagem key={m.id} ficha={m} monstro />)}
        </div>
      )}
    </>
  );
}
