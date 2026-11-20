import { useEffect, useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (n: number) => void;
};

/** Campo numérico que deixa digitar "-" ou apagar tudo sem pular para 0. */
export function NumInput({ value, onChange, onBlur, ...resto }: Props) {
  const [texto, setTexto] = useState(String(value ?? 0));

  useEffect(() => {
    if (Number(texto) !== value) setTexto(String(value ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      {...resto}
      value={texto}
      onChange={e => {
        setTexto(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== '' && Number.isFinite(n)) onChange(n);
      }}
      onBlur={e => {
        // normaliza ao sair do campo ("02" → "2", "" → valor atual)
        setTexto(String(value ?? 0));
        onBlur?.(e);
      }}
    />
  );
}
