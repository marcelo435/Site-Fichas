import { useEffect, useState } from 'react';
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router';
import { Toasts } from './components/Toasts';
import { NaoEncontrado } from './components/NaoEncontrado';
import { FundoArvore } from './components/FundoArvore';
import { rolarEMostrar } from './lib/rolagem';
import { Personagens } from './pages/Personagens';
import { Monstros } from './pages/Monstros';
import { Mesas } from './pages/Mesas';
import { Mesa } from './pages/Mesa';
import { EntrarMesa } from './pages/EntrarMesa';
import { Ficha } from './pages/Ficha';
import { Rituais } from './pages/Rituais';
import { LivroCapitulos, LivroPdf } from './pages/Livro';
import { Sistema } from './pages/Sistema';

function Topo() {
  const { pathname, search } = useLocation();
  const [expr, setExpr] = useState('1d20');
  // A ficha conta como "Mesas" quando foi aberta a partir de uma mesa.
  const naFicha = pathname.startsWith('/personagem/');
  const veioDeMesa = naFicha && search.includes('mesa=');
  const ativo = (cond: boolean) => (cond ? 'active' : '');

  return (
    <header className="topbar">
      <Link to="/personagens" className="logo">ABISMIO</Link>
      <nav>
        <NavLink to="/personagens" className={ativo((naFicha && !veioDeMesa) || pathname === '/personagens')}>Personagens</NavLink>
        <NavLink to="/monstros" className={ativo(/^\/monstros?(\/|$)/.test(pathname))}>Monstros</NavLink>
        <NavLink to="/mesas" className={ativo(veioDeMesa || /^\/(mesas?|entrar)(\/|$)/.test(pathname))}>Mesas</NavLink>
        <NavLink to="/rituais">Rituais</NavLink>
        <NavLink to="/livro">Livro</NavLink>
        <NavLink to="/sistema">Sistema</NavLink>
      </nav>
      <form className="dados-rapidos" onSubmit={e => { e.preventDefault(); rolarEMostrar(expr); }}>
        <input value={expr} onChange={e => setExpr(e.target.value)} aria-label="Expressão de dados" spellCheck={false} />
        <button className="btn">🎲 Rolar</button>
      </form>
    </header>
  );
}

function RolarParaTopo() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <HashRouter>
      <FundoArvore />
      <RolarParaTopo />
      <Topo />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/personagens" replace />} />
          <Route path="/personagens" element={<Personagens />} />
          <Route path="/personagem/:personagemId" element={<Ficha key="personagem" />} />
          <Route path="/monstros" element={<Monstros />} />
          <Route path="/monstro/:monstroId" element={<Ficha key="monstro" monstro />} />
          <Route path="/mesas" element={<Mesas />} />
          <Route path="/mesa/:mesaId" element={<Mesa />} />
          <Route path="/entrar/:codigo?" element={<EntrarMesa />} />
          <Route path="/rituais" element={<Rituais />} />
          <Route path="/livro" element={<LivroPdf />} />
          <Route path="/livro/capitulos/:capId?" element={<LivroCapitulos />} />
          <Route path="/sistema" element={<Sistema />} />
          <Route path="*" element={<NaoEncontrado msg="Página não encontrada." />} />
        </Routes>
      </main>
      <Toasts />
    </HashRouter>
  );
}
