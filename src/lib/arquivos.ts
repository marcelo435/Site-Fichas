import { toast } from './toasts';

export function baixarJSON(nome: string, dados: unknown) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function escolherArquivo(accept: string): Promise<File | null> {
  return new Promise(res => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = accept;
    i.onchange = () => res(i.files?.[0] ?? null);
    i.click();
  });
}

export async function lerJSON(): Promise<unknown> {
  const arq = await escolherArquivo('.json,application/json');
  if (!arq) return null;
  try {
    return JSON.parse(await arq.text());
  } catch {
    toast('Arquivo inválido: não é um JSON.', 'erro');
    return null;
  }
}

/** Reduz a imagem para caber no armazenamento do navegador. PNG mantém a transparência. */
export function redimensionarImagem(file: File, max = 320, formato: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL(formato, 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error('Imagem inválida'));
    };
    img.src = url;
  });
}
