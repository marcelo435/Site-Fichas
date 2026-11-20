import { useEffect } from 'react';

export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} — Abismio` : 'Abismio';
  }, [titulo]);
}
