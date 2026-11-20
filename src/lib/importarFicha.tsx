import type { Ficha, Ritual } from '../types';
import { acoes } from '../store';
import { lerJSON } from './arquivos';
import { toast } from './toasts';

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
