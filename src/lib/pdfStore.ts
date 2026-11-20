/**
 * Guarda o PDF do livro no IndexedDB do navegador (aguenta arquivos grandes,
 * ao contrário do localStorage).
 */
const BANCO = 'abismio-arquivos';
const TABELA = 'arquivos';
const CHAVE = 'livro-pdf';

export interface PdfSalvo {
  nome: string;
  arquivo: Blob;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(TABELA);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function transacao<T>(modo: IDBTransactionMode, fazer: (t: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  try {
    return await new Promise<T>((res, rej) => {
      const req = fazer(db.transaction(TABELA, modo).objectStore(TABELA));
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  } finally {
    db.close();
  }
}

export const lerPdf = () => transacao<PdfSalvo | undefined>('readonly', t => t.get(CHAVE));
export const salvarPdf = (p: PdfSalvo) => transacao('readwrite', t => t.put(p, CHAVE));
export const apagarPdf = () => transacao('readwrite', t => t.delete(CHAVE));

/** Se existir public/livro.pdf no projeto, usa ele como padrão. */
export async function pdfDoProjeto(): Promise<string | null> {
  try {
    const r = await fetch('livro.pdf', { method: 'HEAD' });
    return r.ok && (r.headers.get('content-type') ?? '').includes('pdf') ? 'livro.pdf' : null;
  } catch {
    return null;
  }
}
