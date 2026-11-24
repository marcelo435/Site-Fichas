import { useState } from 'react';
import type { Ritual } from '../types';
import { acoes, ritualVazio, useDados } from '../store';
import { Modal } from './Modal';

interface Props {
  ritual?: Ritual;
  /** o ritual veio preenchido mas ainda não está na biblioteca (ex.: desenho do Altar) */
  novo?: boolean;
  aoFechar: () => void;
  /** chamado depois de salvar */
  aoSalvar?: (r: Ritual) => void;
}

export function RitualForm({ ritual, novo, aoFechar, aoSalvar }: Props) {
  const sistema = useDados(s => s.sistema);
  const [r, setR] = useState<Ritual>(() => (ritual ? { ...ritual } : ritualVazio()));
  const mudar = <K extends keyof Ritual>(k: K, v: Ritual[K]) => setR(x => ({ ...x, [k]: v }));

  const elementos = ['', ...sistema.elementos];
  if (r.elemento && !elementos.includes(r.elemento)) elementos.push(r.elemento);
  const maxCirculo = Math.max(sistema.circulos, r.circulo, 1);

  const texto = (k: 'custo' | 'execucao' | 'alcance' | 'alvo' | 'duracao' | 'resistencia', rotulo: string, ph: string) => (
    <label className="campo">
      {rotulo}
      <input value={r[k]} placeholder={ph} onChange={e => mudar(k, e.target.value)} />
    </label>
  );

  return (
    <Modal
      titulo={ritual && !novo ? 'Editar ritual' : 'Novo ritual'}
      largo
      aoFechar={aoFechar}
      aoSalvar={() => {
        const salvo = { ...r, nome: r.nome.trim() };
        acoes().salvarRitual(salvo);
        aoSalvar?.(salvo);
        aoFechar();
      }}
    >
      <label className="campo">
        Nome
        <input required autoFocus value={r.nome} onChange={e => mudar('nome', e.target.value)} />
      </label>
      <div className="linha">
        <label className="campo">
          Elemento
          <select value={r.elemento} onChange={e => mudar('elemento', e.target.value)}>
            {elementos.map(x => <option key={x} value={x}>{x || '—'}</option>)}
          </select>
        </label>
        <label className="campo">
          Círculo
          <select value={r.circulo} onChange={e => mudar('circulo', Number(e.target.value))}>
            {Array.from({ length: maxCirculo }, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}º</option>)}
          </select>
        </label>
        {texto('custo', 'Custo', 'ex: 2 PE')}
      </div>
      <div className="linha">
        {texto('execucao', 'Execução', 'ex: padrão')}
        {texto('alcance', 'Alcance', 'ex: curto')}
      </div>
      <div className="linha">
        {texto('alvo', 'Alvo / Área', 'ex: 1 ser')}
        {texto('duracao', 'Duração', 'ex: cena')}
        {texto('resistencia', 'Resistência', 'ex: Vontade anula')}
      </div>
      <label className="campo">
        Descrição
        <textarea rows={9} value={r.descricao} onChange={e => mudar('descricao', e.target.value)} />
        <small>Aceita **negrito**, *itálico*, listas com “- ”, títulos com “#” e tabelas.</small>
      </label>
    </Modal>
  );
}
