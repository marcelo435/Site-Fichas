import type { ReactNode } from 'react';
import { create } from 'zustand';
import { uid } from './util';

export type TipoToast = 'normal' | 'erro' | 'rolagem';

interface Toast {
  id: string;
  conteudo: ReactNode;
  tipo: TipoToast;
}

export const useToasts = create<{ lista: Toast[] }>(() => ({ lista: [] }));

export function toast(conteudo: ReactNode, tipo: TipoToast = 'normal') {
  const id = uid();
  useToasts.setState(s => ({ lista: [...s.lista, { id, conteudo, tipo }] }));
  setTimeout(() => {
    useToasts.setState(s => ({ lista: s.lista.filter(t => t.id !== id) }));
  }, 4500);
}
