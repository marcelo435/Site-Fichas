import { useToasts } from '../lib/toasts';

export function Toasts() {
  const lista = useToasts(s => s.lista);
  return (
    <div id="toasts">
      {lista.map(t => (
        <div key={t.id} className={`toast ${t.tipo}`}>{t.conteudo}</div>
      ))}
    </div>
  );
}
