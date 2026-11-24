import { useState, type FormEvent } from 'react';
import type { Ritual, Selo } from '../types';
import { acoes, useDados } from '../store';
import { RitualCard } from '../components/RitualCard';
import { RitualForm } from '../components/RitualForm';
import { Montador } from '../components/altar/Montador';
import { AltarLivre } from '../components/altar/AltarLivre';
import { Circulo, Glifo } from '../components/altar/Circulo';
import { CIRCULOS, EXEMPLOS, FAMILIA_SINGULAR, FAMILIAS, SIMBOLOS, type Familia } from '../lib/altarDados';
import { circuloDe, leitura, ritualDoSelo, SIMBOLO, seloVazio, textoDoSelo } from '../lib/altar';
import { copiar } from '../lib/convite';
import { toast } from '../lib/toasts';
import { uid } from '../lib/util';
import { useTitulo } from '../lib/useTitulo';

/**
 * Senha do Grimório do mestre. Ela só esconde o significado dos símbolos dos jogadores:
 * quem abrir o código do site consegue ler. Troque aqui se quiser.
 */
const SENHA_MESTRE = 'abismo';
const CHAVE_MESTRE = 'abismio-mestre';

type Aba = 'altar' | 'grimorio' | 'biblioteca';
type SubAba = 'criar' | 'simbolos' | 'exemplos';

const exemploParaSelo = (e: { circ: string; centro: string; nos: string[] }): Selo =>
  ({ circ: e.circ, centro: e.centro, nos: Array.from({ length: circuloDe(e.circ).n }, (_, i) => e.nos[i] ?? null) });

const mestreLiberado = () => {
  try { return localStorage.getItem(CHAVE_MESTRE) === '1'; } catch { return false; }
};

function Portao({ aoEntrar }: { aoEntrar: () => void }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [tremer, setTremer] = useState(false);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (senha === SENHA_MESTRE) {
      try { localStorage.setItem(CHAVE_MESTRE, '1'); } catch { /* sem localStorage: vale só nesta visita */ }
      aoEntrar();
    } else {
      setErro(true);
      setTremer(true);
    }
  };
  return (
    <form className={`painel portao-mestre ${tremer ? 'tremer' : ''}`} onSubmit={enviar} onAnimationEnd={() => setTremer(false)}>
      <h2>Grimório do mestre</h2>
      <p className="sub">Aqui fica o significado de cada símbolo e o criador de rituais. Digite a senha do mestre para abrir.</p>
      <input type="password" autoFocus value={senha} onChange={e => { setSenha(e.target.value); setErro(false); }} aria-label="Senha do mestre" />
      {erro && <small className="erro">Senha errada.</small>}
      <button className="btn primario">Entrar</button>
    </form>
  );
}

export function Rituais() {
  useTitulo('Rituais');
  const { rituais, sistema, personagens, monstros } = useDados();
  const [aba, setAba] = useState<Aba>('altar');
  const [sub, setSub] = useState<SubAba>('criar');
  const [liberado, setLiberado] = useState(mestreLiberado);

  // Altar (jogadores)
  const [altar, setAltar] = useState<Selo>(() => seloVazio());
  // Criador (mestre): desenho, nome e, se estiver editando, o ritual da biblioteca
  const [criador, setCriador] = useState<{ selo: Selo; nome: string; id?: string }>(() =>
    ({ selo: exemploParaSelo(EXEMPLOS[0]), nome: '' }));

  // Biblioteca
  const [busca, setBusca] = useState('');
  const [elemento, setElemento] = useState('');
  const [circulo, setCirculo] = useState('');
  /** novo = ritual que ainda não está na biblioteca (ex.: vindo do Altar), mesmo já vindo preenchido */
  const [form, setForm] = useState<{ ritual?: Ritual; novo?: boolean } | null>(null);

  // Símbolos
  const [buscaSimb, setBuscaSimb] = useState('');
  const [famSimb, setFamSimb] = useState<Familia | ''>('');

  const porNoAltar = (s: Selo) => {
    setAltar({ circ: s.circ, centro: s.centro, nos: [...s.nos] });
    setAba('altar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const abrirNoCriador = (s: Selo, nome: string, id?: string) => {
    setCriador({ selo: { circ: s.circ, centro: s.centro, nos: [...s.nos] }, nome, id });
    setSub('criar');
    setAba('grimorio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const salvarNaBiblioteca = () => {
    const nome = criador.nome.trim();
    if (!criador.selo.centro) return toast('Coloque um símbolo no centro antes de salvar.', 'erro');
    if (!nome) return toast('Dê um nome ao ritual antes de salvar.', 'erro');
    const base = criador.id ? rituais.find(r => r.id === criador.id) : undefined;
    const r = ritualDoSelo(criador.selo, nome, base);
    acoes().salvarRitual(r);
    setCriador(c => ({ ...c, id: r.id }));
    toast(<>Ritual <strong>{nome}</strong> {base ? 'atualizado' : 'salvo'} na biblioteca.</>);
  };

  const excluir = (r: Ritual) => {
    const usos = [...personagens, ...monstros].filter(f => f.rituais.includes(r.id)).length;
    const aviso = usos ? `\nEle será removido de ${usos} ficha(s).` : '';
    if (confirm(`Excluir o ritual "${r.nome}"?${aviso}`)) acoes().excluirRitual(r.id);
  };

  const termo = busca.trim().toLowerCase();
  const lista = rituais
    .filter(r => !elemento || r.elemento === elemento)
    .filter(r => !circulo || String(r.circulo) === circulo)
    .filter(r => !termo || `${r.nome} ${r.descricao}`.toLowerCase().includes(termo))
    .sort((a, b) => a.circulo - b.circulo || a.nome.localeCompare(b.nome));

  const termoSimb = buscaSimb.trim().toLowerCase();
  const simbolos = SIMBOLOS.filter(s => (!famSimb || s.fam === famSimb) &&
    (!termoSimb || `${s.nome} ${s.en} ${s.ess} ${s.nuc} ${s.no} ${s.c.join(' ')}`.toLowerCase().includes(termoSimb)));

  const editando = criador.id ? rituais.find(r => r.id === criador.id) : undefined;

  return (
    // no Altar, título e abas entram na mesma folha de papel do círculo
    <div className={aba === 'altar' ? 'folha-altar' : undefined}>
      <div className="cabecalho">
        <div>
          <h1>Rituais</h1>
          <p className="sub">
            Monte rituais no círculo do Abismo: o centro diz o que o ritual faz, os nós dizem como. Os rituais salvos vão para a
            biblioteca e podem ser adicionados nas fichas.
          </p>
        </div>
        {aba === 'biblioteca' && <button className="btn primario" onClick={() => setForm({})}>+ Ritual escrito à mão</button>}
      </div>

      <nav className="abas-ficha abas-rituais">
        <button className={aba === 'altar' ? 'ativo' : ''} onClick={() => setAba('altar')}>Altar</button>
        <button className={aba === 'grimorio' ? 'ativo' : ''} onClick={() => setAba('grimorio')}>
          Grimório do mestre {!liberado && <span aria-hidden="true">🔒</span>}
        </button>
        <button className={aba === 'biblioteca' ? 'ativo' : ''} onClick={() => setAba('biblioteca')}>
          Biblioteca <span className="contador">{rituais.length}</span>
        </button>
      </nav>

      {aba === 'altar' && (
        <AltarLivre selo={altar} mudar={setAltar}
          aoMestre={() => setAba('grimorio')}
          aoBiblioteca={() => setAba('biblioteca')}
          aoSalvar={s => setForm({ ritual: ritualDoSelo(s, ''), novo: true })} />
      )}

      {aba === 'grimorio' && !liberado && <Portao aoEntrar={() => setLiberado(true)} />}

      {aba === 'grimorio' && liberado && (
        <>
          <div className="sub-abas">
            {([['criar', 'Criar ritual'], ['simbolos', 'Os 40 símbolos'], ['exemplos', 'Exemplos']] as const).map(([k, t]) => (
              <button key={k} className={`filtro ${sub === k ? 'ativo' : ''}`} onClick={() => setSub(k)}>{t}</button>
            ))}
            <button className="btn mini trancar" onClick={() => {
              try { localStorage.removeItem(CHAVE_MESTRE); } catch { /* ok */ }
              setLiberado(false);
            }}>🔒 Trancar</button>
          </div>

          {sub === 'criar' && (
            <Montador selo={criador.selo} mudar={s => setCriador(c => ({ ...c, selo: s }))}
              rodape={(
                <div className="salvar-ritual">
                  {editando && <p className="dica">Editando <b>{editando.nome}</b> da biblioteca. Salvar atualiza o ritual (e as fichas que o usam).</p>}
                  <div className="linha-salvar">
                    <input placeholder="Nome do ritual (ex.: Bola de Fogo)" value={criador.nome}
                      onChange={e => setCriador(c => ({ ...c, nome: e.target.value }))} />
                    <button className="btn primario" onClick={salvarNaBiblioteca}>
                      {editando ? 'Salvar alterações' : 'Salvar na biblioteca'}
                    </button>
                  </div>
                  <div className="acoes-ritual">
                    <button className="btn" onClick={() => porNoAltar(criador.selo)} disabled={!criador.selo.centro}>Pôr no altar</button>
                    <button className="btn" disabled={!criador.selo.centro}
                      onClick={() => copiar(textoDoSelo(criador.selo, criador.nome.trim()), 'Ritual copiado.')}>Copiar texto</button>
                    {editando && <button className="btn" onClick={() => setCriador(c => ({ ...c, id: undefined, nome: `${c.nome} (cópia)` }))}>Salvar como novo</button>}
                    <button className="btn perigo" onClick={() => setCriador({ selo: seloVazio(criador.selo.circ), nome: '' })}>Limpar tudo</button>
                  </div>
                </div>
              )} />
          )}

          {sub === 'simbolos' && (
            <>
              <div className="filtros painel">
                <input type="search" placeholder="Buscar: fogo, veneno, tempo…" value={buscaSimb} onChange={e => setBuscaSimb(e.target.value)} />
                <select value={famSimb} onChange={e => setFamSimb(e.target.value as Familia | '')}>
                  <option value="">Todas as famílias</option>
                  {(Object.keys(FAMILIAS) as Familia[]).map(f => <option key={f} value={f}>{FAMILIAS[f]}</option>)}
                </select>
              </div>
              <p className="dica">Cada símbolo tem um sentido no centro (o que o ritual faz) e outro num nó (como ele faz). O círculo muda a leitura do centro.</p>
              {simbolos.length === 0 ? <div className="vazio painel"><p>Nenhum símbolo encontrado.</p></div> : (
                <div className="cartas-simbolos">
                  {simbolos.map(s => (
                    <article key={s.id} className="painel carta-simbolo">
                      <header>
                        <Glifo id={s.id} tamanho={48} />
                        <div>
                          <h3>{s.nome} <span className="tag">{FAMILIA_SINGULAR[s.fam]}</span></h3>
                          <small>{s.en}</small>
                        </div>
                      </header>
                      <p className="essencia">{s.ess}</p>
                      <p><b>No centro:</b> {s.nuc}</p>
                      <p><b>Num nó:</b> {s.no}</p>
                      <table>
                        <tbody>
                          {CIRCULOS.map((c, i) => <tr key={c.id}><td>{c.nome}</td><td>{s.c[i].charAt(0).toUpperCase() + s.c[i].slice(1)}</td></tr>)}
                        </tbody>
                      </table>
                      <p><b>Combina com:</b> {s.comb}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {sub === 'exemplos' && (
            <div className="lista-exemplos">
              {EXEMPLOS.map(e => {
                const selo = exemploParaSelo(e);
                const nos = e.nos.map(id => SIMBOLO[id].nome).join(', ');
                return (
                  <article key={e.nome} className="painel exemplo-ritual">
                    <Circulo selo={selo} mini />
                    <div>
                      <h3>{e.nome}</h3>
                      <small className="dica">Círculo {circuloDe(e.circ).de} · {SIMBOLO[e.centro].nome}{nos ? ` → ${nos}` : ''}</small>
                      <p className="leitura-curta">{leitura(selo).texto}</p>
                      <div className="acoes-ritual">
                        <button className="btn mini" onClick={() => abrirNoCriador(selo, e.nome)}>Abrir no criador</button>
                        <button className="btn mini" onClick={() => porNoAltar(selo)}>Pôr no altar</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {aba === 'biblioteca' && (
        <>
          <div className="filtros painel">
            <input placeholder="Buscar por nome ou texto..." value={busca} onChange={e => setBusca(e.target.value)} />
            <select value={elemento} onChange={e => setElemento(e.target.value)}>
              <option value="">Todos os elementos</option>
              {sistema.elementos.map(e => <option key={e}>{e}</option>)}
            </select>
            <select value={circulo} onChange={e => setCirculo(e.target.value)}>
              <option value="">Todos os círculos</option>
              {Array.from({ length: Math.max(sistema.circulos, CIRCULOS.length) }, (_, i) => i + 1).map(c => (
                <option key={c} value={c}>{CIRCULOS[c - 1] ? `${c}º · ${CIRCULOS[c - 1].nome}` : `${c}º círculo`}</option>
              ))}
            </select>
          </div>

          {rituais.length === 0 ? (
            <div className="vazio painel"><p>Nenhum ritual ainda. Monte um no Grimório do mestre e salve, ou escreva um à mão.</p></div>
          ) : lista.length === 0 ? (
            <div className="vazio painel"><p>Nenhum ritual bate com o filtro.</p></div>
          ) : (
            <div className="lista-rituais">
              {lista.map(r => (
                <RitualCard key={r.id} ritual={r}>
                  {r.selo && (
                    <>
                      <button className="btn mini" onClick={() => abrirNoCriador(r.selo as Selo, r.nome, r.id)}>Editar no círculo</button>
                      <button className="btn mini" onClick={() => porNoAltar(r.selo as Selo)}>Pôr no altar</button>
                    </>
                  )}
                  <button className="btn mini" onClick={() => setForm({ ritual: r })}>{r.selo ? 'Editar detalhes' : 'Editar'}</button>
                  <button className="btn mini" onClick={() =>
                    acoes().salvarRitual({ ...structuredClone(r), id: uid(), nome: `${r.nome} (cópia)`, criadoEm: Date.now() })}>
                    Duplicar
                  </button>
                  <button className="btn mini perigo" onClick={() => excluir(r)}>Excluir</button>
                </RitualCard>
              ))}
            </div>
          )}
        </>
      )}

      {form && (
        <RitualForm ritual={form.ritual} novo={form.novo} aoFechar={() => setForm(null)}
          aoSalvar={form.novo ? r => toast(<>Ritual <strong>{r.nome}</strong> salvo na biblioteca.</>) : undefined} />
      )}
    </div>
  );
}

