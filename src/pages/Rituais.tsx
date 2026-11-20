import { useState } from 'react';
import type { Ritual } from '../types';
import { acoes, useDados } from '../store';
import { RitualCard } from '../components/RitualCard';
import { RitualForm } from '../components/RitualForm';
import { uid } from '../lib/util';
import { useTitulo } from '../lib/useTitulo';

export function Rituais() {
  useTitulo('Rituais');
  const { rituais, sistema, personagens } = useDados();
  const [busca, setBusca] = useState('');
  const [elemento, setElemento] = useState('');
  const [circulo, setCirculo] = useState('');
  const [form, setForm] = useState<{ ritual?: Ritual } | null>(null);

  const termo = busca.trim().toLowerCase();
  const lista = rituais
    .filter(r => !elemento || r.elemento === elemento)
    .filter(r => !circulo || String(r.circulo) === circulo)
    .filter(r => !termo || `${r.nome} ${r.descricao}`.toLowerCase().includes(termo))
    .sort((a, b) => a.circulo - b.circulo || a.nome.localeCompare(b.nome));

  const excluir = (r: Ritual) => {
    const usos = personagens.filter(f => f.rituais.includes(r.id)).length;
    const aviso = usos ? `\nEle será removido de ${usos} ficha(s).` : '';
    if (confirm(`Excluir o ritual "${r.nome}"?${aviso}`)) acoes().excluirRitual(r.id);
  };

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Rituais</h1>
          <p className="sub">Biblioteca de rituais da campanha. Depois é só adicionar nas fichas.</p>
        </div>
        <button className="btn primario" onClick={() => setForm({})}>+ Novo ritual</button>
      </div>

      <div className="filtros painel">
        <input placeholder="Buscar por nome ou texto..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select value={elemento} onChange={e => setElemento(e.target.value)}>
          <option value="">Todos os elementos</option>
          {sistema.elementos.map(e => <option key={e}>{e}</option>)}
        </select>
        <select value={circulo} onChange={e => setCirculo(e.target.value)}>
          <option value="">Todos os círculos</option>
          {Array.from({ length: sistema.circulos }, (_, i) => i + 1).map(c => (
            <option key={c} value={c}>{c}º círculo</option>
          ))}
        </select>
      </div>

      {rituais.length === 0 ? (
        <div className="vazio painel"><p>Nenhum ritual criado. Clique em “+ Novo ritual”.</p></div>
      ) : lista.length === 0 ? (
        <div className="vazio painel"><p>Nenhum ritual bate com o filtro.</p></div>
      ) : (
        <div className="lista-rituais">
          {lista.map(r => (
            <RitualCard key={r.id} ritual={r}>
              <button className="btn mini" onClick={() => setForm({ ritual: r })}>Editar</button>
              <button className="btn mini" onClick={() =>
                acoes().salvarRitual({ ...structuredClone(r), id: uid(), nome: `${r.nome} (cópia)`, criadoEm: Date.now() })}>
                Duplicar
              </button>
              <button className="btn mini perigo" onClick={() => excluir(r)}>Excluir</button>
            </RitualCard>
          ))}
        </div>
      )}

      {form && <RitualForm ritual={form.ritual} aoFechar={() => setForm(null)} />}
    </>
  );
}
