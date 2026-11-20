import { Link } from 'react-router';

export function NaoEncontrado({ msg }: { msg: string }) {
  return (
    <div className="vazio painel">
      <p>{msg}</p>
      <Link className="btn" to="/personagens">Voltar aos personagens</Link>
    </div>
  );
}
