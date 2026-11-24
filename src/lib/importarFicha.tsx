import type { Ficha, Ritual } from '../types';
import { acoes } from '../store';
import { lerJSON } from './arquivos';
import { toast } from './toasts';

/** Abre um .json de monstro exportado e cria o monstro (aceita também uma ficha de personagem). */
export async function importarMonstroDeArquivo(): Promise<string | null> {
  const d = (await lerJSON()) as { tipo?: string; ficha?: Ficha; rituais?: Ritual[] } | null;
  if (!d) return null;
  if ((d.tipo !== 'monstro' && d.tipo !== 'ficha') || !d.ficha) {
    toast('Esse arquivo não é um monstro exportado do Abismio.', 'erro');
    return null;
  }
  const id = acoes().importarMonstro(d.ficha, d.rituais ?? []);
  toast(<>Monstro <strong>{d.ficha.nome}</strong> importado.</>);
  return id;
}

/** Abre um .json de ficha exportada e cria o personagem (opcionalmente já numa mesa). */
export async function importarFichaDeArquivo(mesaId?: string): Promise<string | null> {
  const d = (await lerJSON()) as { tipo?: string; ficha?: Ficha; rituais?: Ritual[] } | null;
  if (!d) return null;
  if (d.tipo !== 'ficha' || !d.ficha) {
    toast('Esse arquivo não é uma ficha exportada do Abismio.', 'erro');
    return null;
  }
  const id = acoes().importarPersonagem(d.ficha, d.rituais ?? [], mesaId);
  toast(<>Personagem <strong>{d.ficha.nome}</strong> importado.</>);
  return id;
}
