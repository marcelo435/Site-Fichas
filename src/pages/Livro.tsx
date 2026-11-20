import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router';
import { acoes, useDados } from '../store';
import { Markdown } from '../components/Markdown';
import { apagarPdf, lerPdf, pdfDoProjeto, salvarPdf } from '../lib/pdfStore';
import { toast } from '../lib/toasts';
import { useTitulo } from '../lib/useTitulo';

function AbasLivro() {
  return (
    <div className="abas abas-pagina">
      <NavLink to="/livro" end className={({ isActive }) => (isActive ? 'ativo' : '')}>Livro (PDF)</NavLink>
      <NavLink to="/livro/capitulos" className={({ isActive }) => (isActive ? 'ativo' : '')}>Capítulos e notas</NavLink>
    </div>
  );
}

/* ---------------- PDF ---------------- */

export function LivroPdf() {
  useTitulo('Livro');
  const [estado, setEstado] = useState<'carregando' | 'vazio' | 'pronto'>('carregando');
  const [url, setUrl] = useState('');
  const [nome, setNome] = useState('');
  const [doProjeto, setDoProjeto] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  // Carrega o PDF salvo (ou o public/livro.pdf) ao abrir a página.
  useEffect(() => {
    let urlCriada = '';
    let cancelado = false;
    (async () => {
      const salvo = await lerPdf().catch(() => undefined);
      if (cancelado) return;
      if (salvo) {
        urlCriada = URL.createObjectURL(salvo.arquivo);
        setUrl(urlCriada);
        setNome(salvo.nome);
        setDoProjeto(false);
        setEstado('pronto');
        return;
      }
      const doProj = await pdfDoProjeto();
      if (cancelado) return;
      if (doProj) {
        setUrl(doProj);
        setNome('livro.pdf');
        setDoProjeto(true);
        setEstado('pronto');
      } else {
        setEstado('vazio');
      }
    })();
    return () => {
      cancelado = true;
      if (urlCriada) URL.revokeObjectURL(urlCriada);
    };
  }, []);

  const usarArquivo = async (arq?: File | null) => {
    if (!arq) return;
    if (arq.type !== 'application/pdf' && !arq.name.toLowerCase().endsWith('.pdf')) {
      toast('Escolha um arquivo .pdf', 'erro');
      return;
    }
    try {
      await salvarPdf({ nome: arq.name, arquivo: arq });
    } catch (e) {
      toast(`Não consegui salvar o PDF: ${(e as Error).message}`, 'erro');
      return;
    }
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    setUrl(URL.createObjectURL(arq));
    setNome(arq.name);
    setDoProjeto(false);
    setEstado('pronto');
    toast(<>Livro <strong>{arq.name}</strong> carregado.</>);
  };

  const remover = async () => {
    if (!confirm('Remover o PDF do livro deste navegador?')) return;
    await apagarPdf();
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    const doProj = await pdfDoProjeto();
    if (doProj) {
      setUrl(doProj);
      setNome('livro.pdf');
      setDoProjeto(true);
    } else {
      setUrl('');
      setEstado('vazio');
    }
  };

  const arrastar = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setArrastando(true); },
    onDragLeave: () => setArrastando(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setArrastando(false); usarArquivo(e.dataTransfer.files[0]); },
  };

  return (
    <>
      <AbasLivro />
      <input ref={inputArquivo} type="file" accept="application/pdf,.pdf" hidden
        onChange={e => { usarArquivo(e.target.files?.[0]); e.target.value = ''; }} />

      {estado === 'carregando' && <div className="vazio painel"><p>Carregando…</p></div>}

      {estado === 'vazio' && (
        <div className={`painel soltar-pdf ${arrastando ? 'arrastando' : ''}`} {...arrastar}
          onClick={() => inputArquivo.current?.click()}>
          <div className="icone-pdf">📖</div>
          <p><strong>Arraste o PDF do livro aqui</strong> ou clique para escolher.</p>
          <p className="dica">O PDF fica salvo neste navegador. Para ele vir junto com o site, coloque o arquivo em <code>public/livro.pdf</code>.</p>
        </div>
      )}

      {estado === 'pronto' && (
        <div {...arrastar} className={arrastando ? 'arrastando' : ''}>
          <div className="livro-barra pdf-barra">
            <span className="pdf-nome">📖 {nome}{doProjeto && <small> (do projeto)</small>}</span>
            <a className="btn mini" href={url} target="_blank" rel="noreferrer">Abrir em nova aba</a>
            <button className="btn mini" onClick={() => inputArquivo.current?.click()}>Trocar PDF</button>
            {!doProjeto && <button className="btn mini perigo" onClick={remover}>Remover</button>}
          </div>
          <iframe className="pdf" src={url} title="Livro" />
        </div>
      )}
    </>
  );
}

/* ---------------- Capítulos (texto) ---------------- */

export function LivroCapitulos() {
  useTitulo('Capítulos');
  const { capId } = useParams();
  const navigate = useNavigate();
  const livro = useDados(s => s.livro);
  const cap = livro.find(c => c.id === capId) ?? livro[0];
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = cap && editandoId === cap.id;

  const novo = () => {
    const id = acoes().criarCapitulo();
    setEditandoId(id);
    navigate(`/livro/capitulos/${id}`);
  };

  const excluir = () => {
    if (!cap || !confirm(`Excluir o capítulo "${cap.titulo}"?`)) return;
    acoes().excluirCapitulo(cap.id);
    setEditandoId(null);
    navigate('/livro/capitulos');
  };

  return (
    <>
      <AbasLivro />
      <div className="livro">
        <aside className="painel livro-indice">
          <h3>Sumário</h3>
          <ol>
            {livro.map(c => (
              <li key={c.id} className={c === cap ? 'ativo' : ''}>
                <Link to={`/livro/capitulos/${c.id}`}>{c.titulo || 'Sem título'}</Link>
              </li>
            ))}
          </ol>
          <button className="btn" onClick={novo}>+ Capítulo</button>
        </aside>

        <article className="painel livro-conteudo">
          {!cap ? (
            <div className="vazio">
              <p>Aqui você escreve textos seus: resumos de regras, regras da casa, ambientação, notas da campanha.</p>
            </div>
          ) : editando ? (
            <>
              <div className="livro-barra">
                <button className="btn mini" title="Mover para cima" onClick={() => acoes().moverCapitulo(cap.id, -1)}>↑</button>
                <button className="btn mini" title="Mover para baixo" onClick={() => acoes().moverCapitulo(cap.id, 1)}>↓</button>
                <button className="btn mini perigo" onClick={excluir}>Excluir</button>
                <button className="btn mini primario" onClick={() => setEditandoId(null)}>Concluir edição</button>
              </div>
              <input className="titulo-cap" value={cap.titulo} placeholder="Título do capítulo"
                onChange={e => acoes().atualizarCapitulo(cap.id, { titulo: e.target.value })} />
              <div className="editor-duplo">
                <textarea value={cap.conteudo}
                  placeholder={'Escreva aqui.\n# Título\n## Subtítulo\n**negrito**, *itálico*\n- listas\n> citação\n| tabela | assim |\n|---|---|\n| a | b |'}
                  onChange={e => acoes().atualizarCapitulo(cap.id, { conteudo: e.target.value })} />
                <div className="previa">
                  <Markdown texto={cap.conteudo} vazio="A prévia aparece aqui." />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="livro-barra">
                <button className="btn mini" onClick={() => setEditandoId(cap.id)}>Editar</button>
              </div>
              <h1>{cap.titulo || 'Sem título'}</h1>
              <Markdown texto={cap.conteudo} vazio="Capítulo vazio." />
            </>
          )}
        </article>
      </div>
    </>
  );
}
