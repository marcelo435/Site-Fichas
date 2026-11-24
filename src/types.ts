export interface Recurso {
  nome: string;
  cor: string;
}

export interface InfoAtributo {
  /** abreviação mostrada nas perícias (ex.: DES) */
  sigla: string;
  /** cor do símbolo */
  cor: string;
  /** imagem enviada pelo usuário (data URL); vazio = símbolo padrão do site */
  simbolo: string;
  /** true = a imagem é uma máscara (branco + transparência) e é pintada com a cor do elemento */
  mascara?: boolean;
}

export interface Pericia {
  nome: string;
  /** atributo que dá os dados; se não for um atributo, vira só um grupo (ex.: Geral) */
  atributo: string;
}

export interface GrupoProficiencia {
  grupo: string;
  itens: string[];
}

export interface Sistema {
  /** em sentido horário a partir do topo do pentágono */
  atributos: string[];
  infoAtributos: Record<string, InfoAtributo>;
  /** símbolo do centro do pentágono (data URL); vazio = espiral padrão */
  simboloCentro: string;
  simboloCentroMascara?: boolean;
  /** atributo que fica no centro e liga os outros (vazio = nenhum) */
  elementoCentral: string;
  recursos: Recurso[];
  pericias: Pericia[];
  proficiencias: GrupoProficiencia[];
  elementos: string[];
  circulos: number;
  /**
   * Expressão de dados. {valor} = número da ficha (atributo, ou treino + bônus na perícia);
   * {dados} = valor do atributo (quantos dados rolar).
   */
  rolagemAtributo: string;
  rolagemPericia: string;
}

export interface ValorRecurso {
  atual: number;
  max: number;
}

export interface Item {
  id: string;
  nome: string;
  qtd: number;
  espaco: number;
  desc: string;
}

/** Entrada genérica de lista (pacto, habilidade). */
export interface Entrada {
  id: string;
  nome: string;
  descricao: string;
  /** só usado em habilidades de nível */
  nivel?: number;
}

export interface Ataque {
  id: string;
  nome: string;
  /** expressão de dados do teste, ex.: 2d20kh1+3 */
  teste: string;
  dano: string;
  critico: string;
  alcance: string;
  obs: string;
}

export interface Ficha {
  id: string;
  nome: string;
  jogador: string;
  /** Pacto / Origem */
  conceito: string;
  nivel: number;
  idade: string;
  altura: string;
  estiloCombate: string;
  familia: string;
  retrato: string;
  atributos: Record<string, number>;
  recursos: Record<string, ValorRecurso>;
  /** treinamento de cada perícia */
  pericias: Record<string, number>;
  bonusPericias: Record<string, number>;
  /** chaves "grupo::item" marcadas */
  proficiencias: string[];
  armadura: number;
  /** Classe de Armadura */
  defesa: number;
  deslocamento: string;
  statusAbismo: number;
  pactos: Entrada[];
  ataques: Ataque[];
  habilidadesNivel: Entrada[];
  /** texto livre de habilidades (versões antigas da ficha) */
  habilidades: string;
  inventario: Item[];
  /** ids de rituais da biblioteca */
  rituais: string[];
  anotacoes: string;
  criadaEm: number;
  atualizadaEm: number;
}

export interface Mesa {
  id: string;
  nome: string;
  descricao: string;
  /** ids dos personagens que participam da mesa */
  personagens: string[];
  criadaEm: number;
}

/** Desenho de um ritual no círculo do Abismo: o círculo, o símbolo do centro e os dos nós. */
export interface Selo {
  circ: string;
  centro: string | null;
  nos: (string | null)[];
}

export interface Ritual {
  id: string;
  nome: string;
  elemento: string;
  circulo: number;
  custo: string;
  execucao: string;
  alcance: string;
  alvo: string;
  duracao: string;
  resistencia: string;
  descricao: string;
  criadoEm: number;
  /** desenho feito no Grimório do mestre (rituais montados no círculo) */
  selo?: Selo;
}

export interface Capitulo {
  id: string;
  titulo: string;
  conteudo: string;
}

export interface Dados {
  sistema: Sistema;
  /** Todos os personagens; existem independente de mesa. */
  personagens: Ficha[];
  /**
   * Monstros do mestre: usam a mesma ficha, com alguns campos com outro sentido
   * (conceito = Tipo, altura = Tamanho, nivel = Ameaça, habilidadesNivel = Habilidades).
   */
  monstros: Ficha[];
  mesas: Mesa[];
  rituais: Ritual[];
  livro: Capitulo[];
}
