import { useEffect, type FormEvent, type ReactNode } from 'react';

interface Props {
  titulo: string;
  aoFechar: () => void;
  aoSalvar: () => void;
  textoSalvar?: string;
  largo?: boolean;
  children: ReactNode;
}

export function Modal({ titulo, aoFechar, aoSalvar, textoSalvar = 'Salvar', largo, children }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aoFechar]);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    aoSalvar();
  };

  return (
    <div className="modal" onMouseDown={e => e.target === e.currentTarget && aoFechar()}>
      <div className={`modal-caixa ${largo ? 'largo' : ''}`} role="dialog" aria-modal="true">
        <h2>{titulo}</h2>
        <form onSubmit={enviar}>
          {children}
          <div className="modal-acoes">
            <button type="button" className="btn" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="btn primario">{textoSalvar}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
