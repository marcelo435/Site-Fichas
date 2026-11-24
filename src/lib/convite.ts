import { toast } from './toasts';

/*
 * Convites de mesa (demonstração).
 * O código sai do id da mesa, então é sempre o mesmo para a mesma mesa. Por enquanto só encontra
 * mesas salvas neste navegador; quando o site tiver servidor, é só trocar a busca em `mesaDoCodigo`.
 */

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I para não confundir

export function codigoDaMesa(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += LETRAS[(h >>> 0) % LETRAS.length];
    h = Math.imul(h ^ (h >>> 13), 2654435761) + i;
  }
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

export function linkDaMesa(id: string): string {
  return `${location.origin}${location.pathname}#/entrar/${codigoDaMesa(id)}`;
}

/** Aceita o código (com ou sem traço, maiúsculo ou não) ou o link inteiro. */
export function lerCodigo(texto: string): string {
  const doLink = texto.match(/entrar\/([A-Za-z0-9-]+)/);
  const limpo = (doLink ? doLink[1] : texto).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return limpo.length > 3 ? `${limpo.slice(0, 3)}-${limpo.slice(3, 6)}` : limpo;
}

export async function copiar(texto: string, aviso = 'Copiado.') {
  try {
    await navigator.clipboard.writeText(texto);
    toast(aviso);
  } catch {
    toast('Não deu para copiar sozinho. Selecione o texto e copie.', 'erro');
  }
}
