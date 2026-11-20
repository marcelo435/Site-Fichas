import { rolarDados } from './dados';
import { toast } from './toasts';
import { num } from './util';

export function rolarEMostrar(expr: string, rotulo?: string) {
  const r = rolarDados(expr);
  if (!r) {
    toast(<>Expressão inválida: <code>{expr}</code></>, 'erro');
    return;
  }
  toast(
    <>
      {rotulo && <strong>{rotulo} </strong>}
      <span className="total">{r.total}</span>
      <small>{r.detalhe}</small>
    </>,
    'rolagem',
  );
}

/**
 * Usa o modelo do sistema (ex.: "{dados}d20kh1+{valor}") com os números da ficha.
 * Com 0 dados (ou menos), rola só 1 dado.
 */
export function rolarComModelo(modelo: string, valor: number, rotulo: string, dados = valor) {
  const d = num(dados);
  const expr = (modelo || '1d20+{valor}')
    .replace(/\{dados\}d(\d+)kh1/g, (_, f) => (d <= 1 ? `1d${f}` : `${d}d${f}kh1`))
    .replaceAll('{dados}', String(Math.max(1, d)))
    .replaceAll('{valor}', String(num(valor)));
  rolarEMostrar(expr, rotulo);
}
