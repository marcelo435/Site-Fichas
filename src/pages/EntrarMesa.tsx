import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { acoes, useDados } from '../store';
import { codigoDaMesa, lerCodigo } from '../lib/convite';
import { iniciais } from '../lib/util';
import { toast } from '../lib/toasts';
import { useTitulo } from '../lib/useTitulo';

/** Página do convite: o jogador cola o código (ou abre o link) e escolhe o personagem que entra na mesa. */
export function EntrarMesa() {
  useTitulo('Entrar numa mesa');
  const { codigo = '' } = useParams();
  const navigate = useNavigate();
  const mesas = useDados(s => s.mesas);
  const personagens = useDados(s => s.personagens);
  const [texto, setTexto] = useState(codigo);
  const [escolhido, setEscolhido] = useState('');

  const cod = lerCodigo(texto);
  const completo = cod.length === 7;
  const mesa = completo ? mesas.find(m => codigoDaMesa(m.id) === cod) : undefined;
  const disponiveis = mesa ? personagens.filter(f => !mesa.personagens.includes(f.id)).sort((a, b) => a.nome.localeCompare(b.nome)) : [];
  const naMesa = mesa ? mesa.personagens.map(id => personagens.find(f => f.id === id)).filter(f => f !== undefined) : [];
  const selecionado = disponiveis.some(f => f.id === escolhido) ? escolhido : disponiveis[0]?.id ?? '';

  const entrar = () => {
    if (!mesa || !selecionado) return;
    acoes().vincular(mesa.id, selecionado);
    const f = personagens.find(x => x.id === selecionado);
    toast(<><strong>{f?.nome}</strong> entrou na mesa <strong>{mesa.nome}</strong>.</>);
    navigate(`/mesa/${mesa.id}`);
  };

  return (
    <>
      <div className="migalhas"><Link to="/mesas">Mesas</Link> › <span>Entrar numa mesa</span></div>
      <div className="cabecalho">
        <div>
          <h1>Entrar numa mesa</h1>
          <p className="sub">Cole o código ou o link que o mestre mandou e escolha o personagem que vai jogar.</p>
        </div>
      </div>

      <div className="aviso-demo">
        <strong>Demonstração.</strong> Por enquanto o convite só encontra mesas salvas neste navegador. Quando o site tiver
        servidor, o mesmo código vai ligar o seu personagem à mesa do mestre de verdade.
      </div>

      <section className="painel entrar-mesa">
        <label className="campo grande">
          Código ou link do convite
          <input value={texto} autoFocus placeholder="ex.: K7P-Q2M" spellCheck={false}
            onChange={e => setTexto(e.target.value)} />
        </label>

        {!texto.trim() && <p className="dica">O código tem 6 letras e números, tipo <code>K7P-Q2M</code>.</p>}
        {texto.trim() && !completo && <p className="dica">Faltam letras no código.</p>}
        {completo && !mesa && (
          <p className="dica erro">Nenhuma mesa com o código <b>{cod}</b> neste navegador. Confira o código com o mestre.</p>
        )}

        {mesa && (
          <div className="convite-mesa">
            <div className="convite-mesa-info">
              <span className="tag">Mesa encontrada</span>
              <h2>{mesa.nome}</h2>
              {mesa.descricao && <p className="sub">{mesa.descricao}</p>}
              <div className="avatares">
                {naMesa.slice(0, 8).map(f => (
                  <span key={f.id} className="avatar" title={f.nome}>{f.retrato ? <img src={f.retrato} alt="" /> : iniciais(f.nome)}</span>
                ))}
                <small>{naMesa.length} personage{naMesa.length === 1 ? 'm' : 'ns'} na mesa</small>
              </div>
            </div>

            {disponiveis.length > 0 ? (
              <div className="convite-escolha">
                <label className="campo">
                  Seu personagem
                  <select value={selecionado} onChange={e => setEscolhido(e.target.value)}>
                    {disponiveis.map(f => <option key={f.id} value={f.id}>{f.nome}{f.jogador ? ` (${f.jogador})` : ''}</option>)}
                  </select>
                </label>
                <button className="btn primario" onClick={entrar}>Entrar na mesa</button>
              </div>
            ) : (
              <p className="dica">Todos os seus personagens já estão nessa mesa.</p>
            )}
            <button className="btn" onClick={() => navigate(`/personagem/${acoes().criarPersonagem(mesa.id)}?mesa=${mesa.id}`)}>
              + Criar um personagem novo nessa mesa
            </button>
          </div>
        )}
      </section>
    </>
  );
}
