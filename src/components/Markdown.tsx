import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Texto formatado: # títulos, **negrito**, *itálico*, listas, tabelas, > citações. */
export function Markdown({ texto, vazio }: { texto: string; vazio?: string }) {
  if (!texto?.trim()) return vazio ? <p className="dica">{vazio}</p> : null;
  return (
    <div className="texto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{texto}</ReactMarkdown>
    </div>
  );
}
