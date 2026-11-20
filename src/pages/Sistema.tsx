import { useState } from 'react';
import type { Dados, InfoAtributo, Recurso, Sistema as TSistema } from '../types';
import { acoes, dadosIniciais, infoAtributo, siglaDe, SISTEMA_PADRAO, useDados } from '../store';
import { SimboloAtributo, SimboloCentro } from '../components/Simbolos';
import { baixarJSON, escolherArquivo, lerJSON, redimensionarImagem } from '../lib/arquivos';
import { mascaraDeArquivo } from '../lib/mascara';
import { toast } from '../lib/toasts';
import { CORES, num } from '../lib/util';
import { useTitulo } from '../lib/useTitulo';

const linhas = (t: string) => [...new Set(t.split(/\r?\n/).map(x => x.trim()).filter(Boolean))];
const partes = (l: string) => l.split('|').map(x => x.trim());
const ehCor = (c?: string): c is string => /^#[0-9a-f]{3,8}$/i.test(c ?? '');

const textoAtributos = (s: TSistema) =>
  s.atributos.map(a => {
    const i = infoAtributo(s, a);
    return `${a} | ${i.sigla} | ${i.cor}`;
  }).join('\n');
const textoRecursos = (s: TSistema) => s.recursos.map(r => `${r.nome} | ${r.cor}`).join('\n');
const textoPericias = (s: TSistema) => s.pericias.map(p => `${p.nome} | ${p.atributo}`).join('\n');
const textoProf = (s: TSistema) => s.proficiencias.map(g => `${g.grupo}: ${g.itens.join(', ')}`).join('\n');

/**
 * Envia uma imagem para um símbolo (null = centro). Salva na hora.
 * Com `recortar`, o fundo é removido e o desenho passa a ser pintado com a cor do elemento.
 */
async function trocarSimbolo(alvo: string | null, recortar: boolean) {
  const arq = await escolherArquivo('image/*');
  if (!arq) return;
  try {
    const url = recortar ? await mascaraDeArquivo(arq) : await redimensionarImagem(arq, 320, 'image/png');
    const s = structuredClone(useDados.getState().sistema);
    if (alvo === null) {
      s.simboloCentro = url;
      s.simboloCentroMascara = recortar;
    } else {
      s.infoAtributos[alvo] = { ...infoAtributo(s, alvo), simbolo: url, mascara: recortar };
    }
    acoes().salvarSistema(s);
  } catch (e) {
    toast((e as Error).message, 'erro');
  }
}

function limparSimbolo(alvo: string | null) {
  const s = structuredClone(useDados.getState().sistema);
  if (alvo === null) s.simboloCentro = '';
  else s.infoAtributos[alvo] = { ...infoAtributo(s, alvo), simbolo: '' };
  acoes().salvarSistema(s);
}

export function Sistema() {
  useTitulo('Sistema');
  const sistema = useDados(s => s.sistema);

  // Estado local do formulário; só vai pro store ao clicar em "Salvar".
  const [atributos, setAtributos] = useState(textoAtributos(sistema));
  const [recursos, setRecursos] = useState(textoRecursos(sistema));
  const [pericias, setPericias] = useState(textoPericias(sistema));
  const [proficiencias, setProficiencias] = useState(textoProf(sistema));
  const [elementos, setElementos] = useState(sistema.elementos.join('\n'));
  const [circulos, setCirculos] = useState(String(sistema.circulos));
  const [rolAtr, setRolAtr] = useState(sistema.rolagemAtributo);
  const [rolPer, setRolPer] = useState(sistema.rolagemPericia);
  const [recortar, setRecortar] = useState(true);
  const [central, setCentral] = useState(sistema.elementoCentral);

  const carregarNoForm = (s: TSistema) => {
    setAtributos(textoAtributos(s));
    setRecursos(textoRecursos(s));
    setPericias(textoPericias(s));
    setProficiencias(textoProf(s));
    setElementos(s.elementos.join('\n'));
    setCirculos(String(s.circulos));
    setRolAtr(s.rolagemAtributo);
    setRolPer(s.rolagemPericia);
    setCentral(s.elementoCentral);
  };

  const salvar = () => {
    const listaAtr: string[] = [];
    const infoAtributos: Record<string, InfoAtributo> = {};
    for (const l of linhas(atributos)) {
      const [nome, sigla, cor] = partes(l);
      if (!nome || listaAtr.includes(nome)) continue;
      const antes = infoAtributo(sistema, nome);
      listaAtr.push(nome);
      infoAtributos[nome] = {
        sigla: (sigla || antes.sigla || siglaDe(nome)).toUpperCase().slice(0, 4),
        cor: ehCor(cor) ? cor : antes.cor,
        simbolo: antes.simbolo,
        mascara: antes.mascara,
      };
    }
    if (!listaAtr.length) {
      toast('Coloque pelo menos um atributo.', 'erro');
      return;
    }
    const listaRec: Recurso[] = [];
    linhas(recursos).forEach((l, i) => {
      const [nome, cor] = partes(l);
      if (nome && !listaRec.some(r => r.nome === nome)) {
        listaRec.push({ nome, cor: ehCor(cor) ? cor : CORES[i % CORES.length] });
      }
    });
    acoes().salvarSistema({
      atributos: listaAtr,
      infoAtributos,
      simboloCentro: sistema.simboloCentro,
      simboloCentroMascara: sistema.simboloCentroMascara,
      elementoCentral: listaAtr.includes(central) ? central : '',
      recursos: listaRec,
      pericias: linhas(pericias)
        .map(l => {
          const [nome, atributo] = partes(l);
          return { nome, atributo: atributo || 'Geral' };
        })
        .filter((p, i, a) => p.nome && a.findIndex(x => x.nome === p.nome) === i),
      proficiencias: linhas(proficiencias)
        .map(l => {
          const [grupo, resto = ''] = l.split(':');
          return { grupo: grupo.trim(), itens: resto.split(',').map(x => x.trim()).filter(Boolean) };
        })
        .filter(g => g.grupo),
      elementos: linhas(elementos),
      circulos: Math.max(1, Math.min(20, num(circulos) || 1)),
      rolagemAtributo: rolAtr.trim() || SISTEMA_PADRAO.rolagemAtributo,
      rolagemPericia: rolPer.trim() || SISTEMA_PADRAO.rolagemPericia,
    });
    carregarNoForm(useDados.getState().sistema);
    toast('Configuração salva.');
  };

  const exportar = () => {
    const { sistema, personagens, mesas, rituais, livro } = useDados.getState();
    const data = new Date().toISOString().slice(0, 10);
    baixarJSON(`abismio-backup-${data}.json`, { tipo: 'backup', versao: 3, sistema, personagens, mesas, rituais, livro });
  };

  const importar = async () => {
    const d = (await lerJSON()) as Partial<Dados> | null;
    if (!d) return;
    if (!Array.isArray(d.mesas) && !Array.isArray(d.personagens)) {
      toast('Esse arquivo não é um backup do Abismio.', 'erro');
      return;
    }
    if (!confirm('Importar vai SUBSTITUIR todos os dados atuais. Continuar?')) return;
    acoes().substituirTudo(d);
    carregarNoForm(useDados.getState().sistema);
    toast('Backup importado.');
  };

  const restaurar = () => {
    if (!confirm('Voltar atributos, perícias, recursos, símbolos e elementos para o padrão? (fichas e rituais não são apagados)')) return;
    acoes().salvarSistema(structuredClone(SISTEMA_PADRAO));
    carregarNoForm(useDados.getState().sistema);
  };

  const apagarTudo = () => {
    if (!confirm('Apagar TODOS os personagens, mesas, rituais e capítulos? (o PDF do livro fica)')) return;
    if (prompt('Digite APAGAR para confirmar.') !== 'APAGAR') return;
    acoes().substituirTudo(dadosIniciais());
    carregarNoForm(useDados.getState().sistema);
    toast('Todos os dados foram apagados.');
  };

  const alvosSimbolo: [string | null, string][] = [...sistema.atributos.map(a => [a, a] as [string, string]), [null, 'Centro']];

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Sistema</h1>
          <p className="sub">Ajuste a ficha às regras do seu livro. Uma entrada por linha.</p>
        </div>
        <button className="btn primario" onClick={salvar}>Salvar configuração</button>
      </div>

      <div className="grade-sistema">
        <section className="painel">
          <h3>Atributos</h3>
          <textarea rows={7} value={atributos} onChange={e => setAtributos(e.target.value)} />
          <p className="dica">
            Formato: <code>Nome | SIGLA | #cor do símbolo</code>. A ordem é a do pentágono, em sentido horário a
            partir do topo.
          </p>
          <label className="campo">
            O que fica no centro
            <select value={central} onChange={e => setCentral(e.target.value)}>
              <option value="">O Abismo (redemoinho com os atributos base)</option>
              {linhas(atributos).map(l => partes(l)[0]).filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </section>
        <section className="painel simbolos-config">
          <h3>Símbolos dos elementos</h3>
          <p className="dica">
            São as bolas dos atributos na ficha. Envie suas próprias imagens; salva na hora. A cor de cada um vem da
            lista de atributos.
          </p>
          <label className="check">
            <input type="checkbox" checked={recortar} onChange={e => setRecortar(e.target.checked)} />
            Remover o fundo e pintar com a cor do elemento
          </label>
          {alvosSimbolo.map(([alvo, rotulo]) => {
            const temImagem = alvo === null ? !!sistema.simboloCentro : !!infoAtributo(sistema, alvo).simbolo;
            return (
              <div key={rotulo} className="simbolo-linha">
                <div className="simbolo-previa" style={{ color: alvo === null ? '#ededf0' : infoAtributo(sistema, alvo).cor }}>{alvo === null ? <SimboloCentro /> : <SimboloAtributo nome={alvo} />}</div>
                <span>{rotulo}</span>
                <button className="btn mini" onClick={() => trocarSimbolo(alvo, recortar)}>Trocar imagem</button>
                {temImagem && <button className="btn mini" onClick={() => limparSimbolo(alvo)}>Usar padrão</button>}
              </div>
            );
          })}
        </section>
        <section className="painel">
          <h3>Recursos (barras)</h3>
          <textarea rows={7} value={recursos} onChange={e => setRecursos(e.target.value)} />
          <p className="dica">Formato: <code>Nome | #cor</code></p>
        </section>
        <section className="painel">
          <h3>Perícias</h3>
          <textarea rows={14} value={pericias} onChange={e => setPericias(e.target.value)} />
          <p className="dica">
            Formato: <code>Nome | Atributo</code>. O atributo dá os dados da perícia; se não for um atributo (ex.:
            Geral), vira só um grupo.
          </p>
        </section>
        <section className="painel">
          <h3>Proficiências</h3>
          <textarea rows={5} value={proficiencias} onChange={e => setProficiencias(e.target.value)} />
          <p className="dica">Formato: <code>Grupo: item, item, item</code></p>
        </section>
        <section className="painel">
          <h3>Rituais</h3>
          <label className="campo">
            Elementos
            <textarea rows={6} value={elementos} onChange={e => setElementos(e.target.value)} />
          </label>
          <label className="campo">
            Quantidade de círculos
            <input type="number" min={1} max={20} value={circulos} onChange={e => setCirculos(e.target.value)} />
          </label>
        </section>
        <section className="painel">
          <h3>Rolagens</h3>
          <label className="campo">
            Ao clicar em um atributo
            <input value={rolAtr} onChange={e => setRolAtr(e.target.value)} />
          </label>
          <label className="campo">
            Ao clicar em uma perícia
            <input value={rolPer} onChange={e => setRolPer(e.target.value)} />
          </label>
          <p className="dica">
            <code>{'{dados}'}</code> = valor do atributo; <code>{'{valor}'}</code> = treinamento + bônus (no
            atributo, o próprio valor). <code>kh1</code> fica com o maior dado, <code>kl1</code> com o menor; com 0
            dados rola só 1. Ex.: <code>{'{dados}d20kh1+{valor}'}</code>, <code>{'1d20+{valor}'}</code>.
          </p>
        </section>
        <section className="painel">
          <h3>Backup</h3>
          <p className="dica">
            Os dados ficam salvos neste navegador. Exporte de vez em quando para não perder nada e para levar para
            outro computador.
          </p>
          <div className="acoes-coluna">
            <button className="btn" onClick={exportar}>Exportar tudo</button>
            <button className="btn" onClick={importar}>Importar backup</button>
            <button className="btn" onClick={restaurar}>Restaurar configuração padrão</button>
            <button className="btn perigo" onClick={apagarTudo}>Apagar todos os dados</button>
          </div>
        </section>
      </div>
      <p className="dica">
        Renomear um atributo/perícia cria um campo novo; o valor antigo continua guardado na ficha e volta se você
        renomear de volta.
      </p>
    </>
  );
}
