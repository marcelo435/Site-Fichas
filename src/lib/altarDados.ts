/* Dados do sistema de rituais do Abismo (vindos do "Altar do Abismo"). Gerado a partir do HTML original. */

export interface Circulo { id: string; nome: string; de: string; n: number; dom: string; cria: string }
export interface Simbolo {
  id: string; nome: string; en: string; fam: Familia;
  /** essência, em uma frase */
  ess: string;
  /** o que faz quando está no centro */
  nuc: string;
  /** o que faz quando está num nó */
  no: string;
  /** como aparece na leitura quando está num nó */
  nf: string;
  /** leitura no centro, em cada círculo (mesma ordem de CIRCULOS) */
  c: string[];
  comb: string;
}
export type Familia = 'el' | 'as' | 'me' | 'su';
export interface Exemplo { nome: string; circ: string; centro: string; nos: string[] }

export const CIRCULOS: Circulo[] = [
 {
  "id": "carne",
  "nome": "Carne",
  "de": "da Carne",
  "n": 8,
  "dom": "Corpo e matéria",
  "cria": "ataques elementais, armas, explosões, mudanças no corpo"
 },
 {
  "id": "espirito",
  "nome": "Espírito",
  "de": "do Espírito",
  "n": 8,
  "dom": "Mente e emoção",
  "cria": "medo, sono, ilusões, comunicação, percepção"
 },
 {
  "id": "forma",
  "nome": "Forma",
  "de": "da Forma",
  "n": 6,
  "dom": "Coisas e espaço",
  "cria": "muralhas, objetos, prisões, portais, matéria transformada"
 },
 {
  "id": "alma",
  "nome": "Alma",
  "de": "da Alma",
  "n": 8,
  "dom": "Vida, morte e vínculos",
  "cria": "cura, maldições, invocações, laços entre pessoas"
 },
 {
  "id": "aurora",
  "nome": "Aurora",
  "de": "da Aurora",
  "n": 5,
  "dom": "Destino e tempo",
  "cria": "renascer, prever, desfazer, mudar o rumo das coisas"
 }
];
export const FAMILIAS: Record<Familia, string> = {
 "el": "Elementos",
 "as": "Astros",
 "me": "Metais",
 "su": "Substâncias"
};
export const FAMILIA_SINGULAR: Record<Familia, string> = {
 "el": "Elemento",
 "as": "Astro",
 "me": "Metal",
 "su": "Substância"
};
/** desenho de cada símbolo (SVG em coordenadas de -1 a 1) */
export const GLIFOS: Record<string, string> = {
 "fogo": "<path d=\"M0 -0.8L0.75 0.55L-0.75 0.55Z\"/>",
 "agua": "<path d=\"M0 0.8L0.75 -0.55L-0.75 -0.55Z\"/>",
 "ar": "<path d=\"M0 -0.8L0.75 0.55L-0.75 0.55ZM-0.62 0.05H0.62\"/>",
 "terra": "<path d=\"M0 0.8L0.75 -0.55L-0.75 -0.55ZM-0.62 -0.05H0.62\"/>",
 "mundo": "<circle r=\"0.72\"/><path d=\"M0 -0.72V0.72M-0.72 0H0.72\"/>",
 "sol": "<circle r=\"0.72\"/><circle r=\"0.15\" class=\"fill\"/>",
 "lua": "<path d=\"M0.49 -0.78A0.8 0.8 0 1 0 0.49 0.78A1 1 0 0 1 0.49 -0.78Z\"/>",
 "mercurio": "<path d=\"M-0.38 -0.95Q0 -0.45 0.38 -0.95\"/><circle cy=\"-0.25\" r=\"0.33\"/><path d=\"M0 0.08V0.92M-0.3 0.55H0.3\"/>",
 "venus": "<circle cy=\"-0.3\" r=\"0.42\"/><path d=\"M0 0.12V0.88M-0.32 0.5H0.32\"/>",
 "marte": "<circle cx=\"-0.18\" cy=\"0.18\" r=\"0.45\"/><path d=\"M0.14 -0.14L0.72 -0.72M0.3 -0.72H0.72V-0.3\"/>",
 "jupiter": "<path d=\"M-0.65 -0.45Q-0.45 -0.9 -0.1 -0.65Q0.15 -0.35 -0.55 0.3H0.65M0.3 -0.15V0.85\"/>",
 "saturno": "<path d=\"M-0.25 -0.85V0.2M-0.55 -0.5H0.05M-0.25 0Q0.45 -0.3 0.38 0.25Q0.32 0.6 0.1 0.82\"/>",
 "urano": "<path d=\"M-0.5 -0.85V0.05M0.5 -0.85V0.05M-0.5 -0.4H0.5M0 -0.85V0.32\"/><circle cy=\"0.58\" r=\"0.24\"/>",
 "netuno": "<path d=\"M-0.6 -0.75Q-0.6 0 0 0Q0.6 0 0.6 -0.75M0 -0.9V0.9M-0.32 0.5H0.32\"/>",
 "ouro": "<path d=\"M-0.6 -0.45H0.6L-0.25 0.85M-0.3 -0.85V-0.1\"/>",
 "ferro": "<path d=\"M-0.42 -0.42H0.42V0.42H-0.42ZM0 -0.88V0.88M-0.88 0H0.88\"/>",
 "lanca": "<path d=\"M0 0.85V-0.85M-0.35 -0.5L0 -0.85L0.35 -0.5M-0.35 0.1H0.35M-0.35 0.45H0.35\"/>",
 "cobre": "<circle r=\"0.2\"/><path d=\"M0 -0.2V-0.62M0 0.2V0.62M-0.17 -0.1L-0.54 -0.31M0.17 0.1L0.54 0.31M-0.17 0.1L-0.54 0.31M0.17 -0.1L0.54 -0.31\"/><circle cy=\"-0.76\" r=\"0.13\"/><circle cy=\"0.76\" r=\"0.13\"/><circle cx=\"-0.66\" cy=\"-0.38\" r=\"0.13\"/><circle cx=\"0.66\" cy=\"0.38\" r=\"0.13\"/><circle cx=\"-0.66\" cy=\"0.38\" r=\"0.13\"/><circle cx=\"0.66\" cy=\"-0.38\" r=\"0.13\"/>",
 "chumbo": "<path d=\"M-0.5 -0.55H0.45L-0.45 0.55H0.5M0.35 -0.85L-0.3 0.85\"/>",
 "estanho": "<circle cx=\"0.18\" cy=\"-0.6\" r=\"0.2\"/><circle cx=\"-0.18\" cy=\"0.6\" r=\"0.2\"/><path d=\"M0.11 -0.41L-0.11 0.41\"/>",
 "latao": "<circle cy=\"-0.38\" r=\"0.38\"/><path d=\"M0 0V0.9M-0.32 0.42H0.32M-0.32 0.68H0.32\"/>",
 "pratav": "<path d=\"M-0.85 -0.7Q-0.45 -0.2 0 -0.6Q0.45 -0.2 0.85 -0.7M0 -0.45V0.3M-0.45 0.85L0 0.3L0.45 0.85M-0.4 -0.05H0.4\"/>",
 "sal": "<circle cy=\"0.22\" r=\"0.48\"/><path d=\"M-0.55 -0.85Q0 -0.05 0.55 -0.85\"/>",
 "selo": "<circle r=\"0.72\"/><path d=\"M-0.72 0H0.72\"/>",
 "enxofre": "<path d=\"M0 -0.85L0.48 -0.1L-0.48 -0.1ZM0 -0.1V0.85M-0.38 0.4H0.38\"/>",
 "salitre": "<circle r=\"0.72\"/><path d=\"M0 -0.72V0.72\"/>",
 "vinagre": "<path d=\"M-0.6 -0.8Q0 0.05 0.6 -0.8M0 -0.38V0.85M-0.4 0.85H0.4M-0.3 0.25H0.3\"/>",
 "restos": "<path d=\"M0 -0.9V0M-0.35 -0.5H0.35\"/><circle cx=\"-0.3\" cy=\"0.42\" r=\"0.28\"/><circle cx=\"0.3\" cy=\"0.42\" r=\"0.28\"/>",
 "antimonio": "<circle cy=\"0.28\" r=\"0.52\"/><path d=\"M0 -0.24V-0.95M-0.3 -0.62H0.3\"/>",
 "arsenico": "<path d=\"M0 -0.2V0.9M-0.35 0.52H0.35M-0.72 -0.55Q-0.72 -0.1 -0.3 -0.2Q0 -0.32 0 -0.85Q0 -0.32 0.3 -0.2Q0.72 -0.1 0.72 -0.55\"/>",
 "alcali": "<path d=\"M-0.55 -0.85V0.2H0.15M-0.1 -0.35V0.7M0.15 0.7Q0.65 0.7 0.72 0.15\"/>",
 "alumen": "<path d=\"M-0.8 0.6Q-0.4 -0.15 0 0.6Q0.4 -0.15 0.8 0.6M0 0.6V-0.85M-0.28 -0.5H0.28\"/>",
 "amonia": "<path d=\"M0 -0.78V0.78M-0.68 -0.39L0.68 0.39M-0.68 0.39L0.68 -0.39\"/>",
 "potassa": "<path d=\"M-0.6 -0.8V-0.15H0.6V-0.8M0 -0.8V0.88M-0.35 0.45H0.35\"/>",
 "fosforo": "<path d=\"M0 -0.15L0.62 0.82H-0.62ZM0 -0.15V-0.92M-0.3 -0.6H0.3\"/>",
 "lapis": "<path d=\"M-0.4 -0.85V0.4M-0.7 -0.55H-0.1M-0.4 -0.1Q0.5 -0.45 0.45 0.25\"/><circle cx=\"0.45\" cy=\"0.58\" r=\"0.2\"/>",
 "oleo": "<circle r=\"0.42\"/><path d=\"M0 -0.9V0.9M-0.9 0H0.9M-0.18 -0.9H0.18M-0.18 0.9H0.18M-0.9 -0.18V0.18M0.9 -0.18V0.18\"/>",
 "acido": "<circle r=\"0.72\"/><path d=\"M0 -0.72V0.72M-0.72 0H0\"/>",
 "acafrao": "<circle cx=\"-0.52\" r=\"0.24\"/><circle cx=\"0.3\" r=\"0.42\"/><path d=\"M-0.28 0H-0.12\"/>",
 "roda": "<circle r=\"0.72\"/><path d=\"M0 -0.72V0.72M-0.72 0H0.72M-0.51 -0.51L0.51 0.51M-0.51 0.51L0.51 -0.51\"/>"
};
export const SIMBOLOS: Simbolo[] = [
 {
  "id": "fogo",
  "nome": "Fogo",
  "en": "FIRE",
  "fam": "el",
  "ess": "A força que consome e transforma.",
  "nuc": "Cria chama, calor ou destruição. É a base de qualquer ataque de fogo.",
  "no": "Deixa o ritual mais forte e mais quente: o efeito arde.",
  "nf": "ardendo",
  "c": [
   "chamas que queimam",
   "fúria que toma a mente",
   "forjar ou derreter",
   "purificar pela chama",
   "renascer das cinzas"
  ],
  "comb": "Terra (lava), Água (vapor), Ar (labareda), Fósforo (fogo-fátuo)"
 },
 {
  "id": "agua",
  "nome": "Água",
  "en": "WATER",
  "fam": "el",
  "ess": "O que flui, lava e cura.",
  "nuc": "Cria água ou outro líquido, e também cura e limpeza. É a base dos rituais de cura.",
  "no": "Faz o efeito durar mais e se espalhar como líquido.",
  "nf": "que dura e se espalha",
  "c": [
   "água em jatos e ondas",
   "calma ou tristeza",
   "fazer a matéria fluir",
   "curar feridas",
   "lavar o passado"
  ],
  "comb": "Sal (gelo), Ar (tempestade), Terra (lama), Lua (reflexo)"
 },
 {
  "id": "ar",
  "nome": "Ar",
  "en": "AIR",
  "fam": "el",
  "ess": "Movimento, sopro e liberdade.",
  "nuc": "Cria vento e movimento: empurrar, puxar, levantar poeira, carregar a voz.",
  "no": "Leva o efeito mais longe e mais rápido.",
  "nf": "levado pelo vento, ao longe",
  "c": [
   "vento e rajadas",
   "pensamento e voz",
   "dar leveza, fazer flutuar",
   "o fôlego, a respiração",
   "o sopro que muda o rumo"
  ],
  "comb": "Água (tempestade), Cobre (relâmpago), Terra (areia), Fogo (labareda)"
 },
 {
  "id": "terra",
  "nome": "Terra",
  "en": "EARTH, triângulo",
  "fam": "el",
  "ess": "Firmeza, peso e proteção.",
  "nuc": "Cria pedra e solo, ou endurece e protege. É a base das defesas.",
  "no": "Deixa o efeito firme e difícil de desfazer.",
  "nf": "firme e resistente",
  "c": [
   "pedra e terra",
   "teimosia, mente fechada",
   "erguer formas de pedra",
   "sepultar, aquietar os mortos",
   "o que o destino não muda"
  ],
  "comb": "Fogo (lava), Potassa (raízes), Água (lama), Mundo (muralha)"
 },
 {
  "id": "mundo",
  "nome": "Mundo",
  "en": "EARTH, círculo com cruz",
  "fam": "el",
  "ess": "O lugar e o território.",
  "nuc": "O ritual age sobre um lugar inteiro: o chão, a sala, a região.",
  "no": "Transforma o efeito em área: afeta tudo em volta.",
  "nf": "sobre toda uma área",
  "c": [
   "o chão sob os pés",
   "o clima de um lugar",
   "mudar o terreno",
   "os mortos daquele lugar",
   "o destino de uma região"
  ],
  "comb": "Qualquer ataque (vira área), Selo (zona protegida), Lápis-lazúli (mapa)"
 },
 {
  "id": "sol",
  "nome": "Sol",
  "en": "SUN",
  "fam": "as",
  "ess": "Luz, verdade e vida.",
  "nuc": "Cria luz, revela o que está escondido e fortalece a vida.",
  "no": "Faz o ritual agir em você mesmo.",
  "nf": "em mim mesmo",
  "c": [
   "luz que cega e queima",
   "revelar mentiras",
   "fazer algo brilhar",
   "força vital",
   "o dia que nasce de novo"
  ],
  "comb": "Fogo (luz ardente), Antimônio (purificar), Lua (eclipse)"
 },
 {
  "id": "lua",
  "nome": "Lua",
  "en": "MOON",
  "fam": "as",
  "ess": "Sombra, sono e segredo.",
  "nuc": "Cria ilusões, sono, sonhos e escuridão.",
  "no": "Deixa o ritual silencioso e escondido.",
  "nf": "em silêncio, escondido",
  "c": [
   "sombra que envolve",
   "sono, sonho, ilusão",
   "esconder ou disfarçar formas",
   "o mundo dos sonhos e dos mortos",
   "visões do que virá"
  ],
  "comb": "Água (reflexo), Amônia (névoa do sono), Mercúrio (mensagem em sonho)"
 },
 {
  "id": "mercurio",
  "nome": "Mercúrio",
  "en": "MERCURY",
  "fam": "as",
  "ess": "Troca, mensagem e velocidade.",
  "nuc": "Leva mensagens, troca coisas de lugar e muda o estado das coisas.",
  "no": "Faz o ritual acontecer num instante.",
  "nf": "num instante",
  "c": [
   "trocar de lugar com algo",
   "falar com a mente de alguém",
   "transportar, abrir passagem",
   "levar uma alma a outro lugar",
   "trocar destinos"
  ],
  "comb": "Estanho (portal), Restos (falar com mortos), Lua (mensagem em sonho)"
 },
 {
  "id": "venus",
  "nome": "Vênus",
  "en": "VENUS",
  "fam": "as",
  "ess": "Atração, amor e vínculo.",
  "nuc": "Atrai, encanta, cria laços e desperta afeto.",
  "no": "Faz o ritual agir num aliado.",
  "nf": "num aliado",
  "c": [
   "puxar algo para perto",
   "encantar, acalmar, seduzir",
   "embelezar, unir duas coisas",
   "criar laço entre duas almas",
   "unir destinos"
  ],
  "comb": "Estanho (elo de vida), Água (cura num aliado), Óleo (bênção)"
 },
 {
  "id": "marte",
  "nome": "Marte",
  "en": "MARS",
  "fam": "as",
  "ess": "Ataque, força e guerra.",
  "nuc": "Cria um ataque direto, força bruta ou uma arma.",
  "no": "Transforma o efeito num projétil lançado à distância.",
  "nf": "lançado como projétil",
  "c": [
   "golpe de força",
   "medo e intimidação",
   "criar uma arma",
   "ferir a alma",
   "um duelo marcado pelo destino"
  ],
  "comb": "Fogo (bola de fogo), Ferro (lâmina), Latão (grito de guerra)"
 },
 {
  "id": "jupiter",
  "nome": "Júpiter",
  "en": "JUPITER",
  "fam": "as",
  "ess": "Comando, ordem e grandeza.",
  "nuc": "Dá ordens, impõe autoridade, faz algo crescer.",
  "no": "Amplia o ritual: fica maior ou atinge mais alvos.",
  "nf": "sobre muitos",
  "c": [
   "aumentar tamanho ou força",
   "comandar, obrigar a obedecer",
   "ampliar objetos e construções",
   "comandar espíritos",
   "impor um destino"
  ],
  "comb": "Marte (ataque em vários), Potassa (crescer rápido), Selo (lei mágica)"
 },
 {
  "id": "saturno",
  "nome": "Saturno",
  "en": "SATURN",
  "fam": "as",
  "ess": "Tempo, peso e fim.",
  "nuc": "Mexe com o tempo: acelera, atrasa, envelhece, encerra.",
  "no": "Atrasa o efeito: ele acontece depois, mais forte.",
  "nf": "depois, com o tempo",
  "c": [
   "envelhecer, apodrecer",
   "tédio e cansaço",
   "desgastar, enferrujar",
   "o fim da vida",
   "o tempo que volta ou avança"
  ],
  "comb": "Roda (voltar no tempo), Açafrão (maldição lenta), Sol (renascer)"
 },
 {
  "id": "urano",
  "nome": "Urano",
  "en": "URANUS",
  "fam": "as",
  "ess": "Raio, caos e sorte.",
  "nuc": "Cria raios e acontecimentos imprevisíveis.",
  "no": "Deixa o ritual instável: pode sair muito forte ou errar o alvo.",
  "nf": "de forma imprevisível",
  "c": [
   "raio que cai",
   "loucura e confusão",
   "mudar a forma ao acaso",
   "alma inquieta",
   "virar a sorte"
  ],
  "comb": "Cobre (tempestade de raios), Ar (trovão), Roda (roleta do destino)"
 },
 {
  "id": "netuno",
  "nome": "Netuno",
  "en": "NEPTUNE",
  "fam": "as",
  "ess": "O Abismo e a profundeza.",
  "nuc": "Puxa o poder do Abismo: corrupção, loucura, coisas do fundo.",
  "no": "Deixa o ritual abissal: mais poderoso, mas corrompe quem conjura.",
  "nf": "com o poder do Abismo",
  "c": [
   "mutação abissal",
   "loucura, sussurros do fundo",
   "dar forma a criaturas do Abismo",
   "corromper a alma",
   "abrir uma fenda"
  ],
  "comb": "Restos (carne abissal), Prata-viva (mutação), Selo (fechar uma fenda)"
 },
 {
  "id": "ouro",
  "nome": "Ouro",
  "en": "GOLD",
  "fam": "me",
  "ess": "Pureza e perfeição.",
  "nuc": "Transmuta, purifica e torna algo valioso ou perfeito.",
  "no": "Deixa o ritual perfeito: atravessa defesas e resistências.",
  "nf": "de forma perfeita",
  "c": [
   "endurecer o corpo como metal",
   "certeza absoluta",
   "transmutar materiais",
   "alma pura, imune à corrupção",
   "um destino de glória"
  ],
  "comb": "Sal (proteção total), Prata-viva (transmutação), Sol (luz sagrada)"
 },
 {
  "id": "ferro",
  "nome": "Ferro",
  "en": "IRON",
  "fam": "me",
  "ess": "Lâmina e ferida.",
  "nuc": "Cria cortes, lâminas e armaduras.",
  "no": "Deixa o efeito afiado e perfurante.",
  "nf": "afiado, cortando",
  "c": [
   "corte, lâmina",
   "palavras que ferem",
   "criar armas e armaduras",
   "separar alma e corpo",
   "cortar um laço do destino"
  ],
  "comb": "Ar (lâmina de vento), Fogo (arma flamejante), Água com Sal (lança de gelo)"
 },
 {
  "id": "lanca",
  "nome": "Lança",
  "en": "FERRUM",
  "fam": "me",
  "ess": "Subir e erguer.",
  "nuc": "Faz coisas subirem, levitarem ou se erguerem do chão.",
  "no": "O efeito vem de cima ou de baixo.",
  "nf": "vindo de cima ou de baixo",
  "c": [
   "levitar, saltar alto",
   "elevar o ânimo",
   "erguer pilares e torres",
   "elevar a alma",
   "subir de posição no destino"
  ],
  "comb": "Fogo com Terra (chuva de lava), Terra (pilar de pedra), Ar (voar)"
 },
 {
  "id": "cobre",
  "nome": "Cobre",
  "en": "COPPER",
  "fam": "me",
  "ess": "Conexão e corrente.",
  "nuc": "Conduz energia (eletricidade, magia, sensações) de um ponto a outro.",
  "no": "O efeito salta de um alvo para o próximo.",
  "nf": "saltando de alvo em alvo",
  "c": [
   "choque elétrico",
   "ligar mentes, sentir emoções",
   "conduzir energia por objetos",
   "passar vida de um para outro",
   "conectar fatos distantes"
  ],
  "comb": "Ar (relâmpago), Urano (raio), Estanho (rede de ligação)"
 },
 {
  "id": "chumbo",
  "nome": "Chumbo",
  "en": "LEAD",
  "fam": "me",
  "ess": "Peso e prisão.",
  "nuc": "Deixa algo pesado, preso ou lento.",
  "no": "Prende ou deixa o alvo lento.",
  "nf": "pesado, prendendo",
  "c": [
   "corpo pesado e lento",
   "sono pesado, desânimo",
   "prender em correntes",
   "prender uma alma",
   "um fardo do qual não se escapa"
  ],
  "comb": "Lua (sono pesado), Terra (prisão de pedra), Saturno (tempo parado)"
 },
 {
  "id": "estanho",
  "nome": "Estanho",
  "en": "TIN",
  "fam": "me",
  "ess": "Ligação entre dois.",
  "nuc": "Liga duas coisas: dois lugares, duas pessoas, dois objetos.",
  "no": "O que acontece com um alvo acontece com o outro.",
  "nf": "ligado a outro",
  "c": [
   "corrente física entre dois",
   "dividir pensamentos",
   "ponte entre dois pontos",
   "dividir dor e vida",
   "destinos entrelaçados"
  ],
  "comb": "Vênus (elo de vida), Mercúrio (portal), Cobre (rede)"
 },
 {
  "id": "latao",
  "nome": "Latão",
  "en": "BRASS",
  "fam": "me",
  "ess": "Som, eco e reflexo.",
  "nuc": "Cria som, ecos e reflexos.",
  "no": "O efeito ecoa: repete uma segunda vez, mais fraco.",
  "nf": "ecoando",
  "c": [
   "estrondo, onda de som",
   "grito que assusta",
   "reflexos, superfícies espelhadas",
   "chamar uma alma pelo nome",
   "ecos do passado"
  ],
  "comb": "Marte (grito de pavor), Lua (voz falsa), Selo (alarme)"
 },
 {
  "id": "pratav",
  "nome": "Prata-viva",
  "en": "QUICK SILVER",
  "fam": "me",
  "ess": "Mudança de forma.",
  "nuc": "Transforma: muda o corpo, a aparência ou o estado de algo.",
  "no": "Disfarça o efeito ou faz ele mudar de forma.",
  "nf": "mudando de forma",
  "c": [
   "transformar o corpo",
   "disfarce, outra identidade",
   "derreter e remodelar",
   "trocar de corpo",
   "virar outra pessoa no destino"
  ],
  "comb": "Netuno (mutação abissal), Lua (disfarce), Ouro (transmutar)"
 },
 {
  "id": "sal",
  "nome": "Sal",
  "en": "SALT, o primeiro",
  "fam": "su",
  "ess": "Proteção e preservação.",
  "nuc": "Protege, conserva e afasta a corrupção.",
  "no": "Protege o alvo e o deixa resistente.",
  "nf": "protegido",
  "c": [
   "proteger o corpo",
   "mente firme, imune ao medo",
   "conservar objetos e comida",
   "afastar espíritos",
   "guardar algo do destino"
  ],
  "comb": "Água (gelo), Selo (círculo protetor), Restos (conservar carne)"
 },
 {
  "id": "selo",
  "nome": "Selo",
  "en": "SALT, círculo cortado",
  "fam": "su",
  "ess": "Selar e banir.",
  "nuc": "Tranca, sela, aprisiona ou expulsa.",
  "no": "Limita o ritual: só afeta quem está dentro, ou protege aliados.",
  "nf": "dentro de um limite",
  "c": [
   "selar ferimentos",
   "trancar memórias",
   "trancar portas e baús",
   "banir espíritos",
   "fechar caminhos do destino"
  ],
  "comb": "Netuno (fechar fenda), Mundo (área segura), Álcali (anular)"
 },
 {
  "id": "enxofre",
  "nome": "Enxofre",
  "en": "SULPHUR",
  "fam": "su",
  "ess": "Explosão e combustão.",
  "nuc": "Cria explosões e combustão violenta.",
  "no": "O efeito explode no ponto de impacto.",
  "nf": "explodindo",
  "c": [
   "explosão",
   "raiva explosiva",
   "estourar objetos",
   "alma em chamas",
   "um acontecimento explosivo"
  ],
  "comb": "Fogo com Marte (bola de fogo), Restos (bomba de restos), Salitre (estouro)"
 },
 {
  "id": "salitre",
  "nome": "Salitre",
  "en": "SALTPETER",
  "fam": "su",
  "ess": "Impulso e estouro.",
  "nuc": "Empurra, impulsiona, estoura.",
  "no": "O efeito empurra o alvo para longe.",
  "nf": "empurrando",
  "c": [
   "impulso, empurrão",
   "susto, sobressalto",
   "lançar objetos",
   "expulsar uma alma",
   "acelerar o destino"
  ],
  "comb": "Ar (rajada), Enxofre (explosão), Lança (salto)"
 },
 {
  "id": "vinagre",
  "nome": "Vinagre",
  "en": "VINEGAR",
  "fam": "su",
  "ess": "Corrosão e azedume.",
  "nuc": "Corrói, azeda e estraga.",
  "no": "O efeito continua ferindo depois.",
  "nf": "corroendo aos poucos",
  "c": [
   "ácido, corrosão",
   "amargura, ressentimento",
   "enferrujar, estragar",
   "alma azeda",
   "estragar planos"
  ],
  "comb": "Açafrão (maldição), Arsênico (veneno), Saturno (apodrecer)"
 },
 {
  "id": "restos",
  "nome": "Restos",
  "en": "MORTOR",
  "fam": "su",
  "ess": "Morte e carne.",
  "nuc": "Mexe com cadáveres, restos e carne de monstro.",
  "no": "Usa carne de monstro: fica mais forte e mórbido.",
  "nf": "feito de carne morta",
  "c": [
   "usar restos e carne",
   "medo da morte",
   "moldar ossos e carne",
   "falar com os mortos",
   "presságio de morte"
  ],
  "comb": "Mercúrio (voz dos mortos), Enxofre (bomba), Netuno (carne abissal)"
 },
 {
  "id": "antimonio",
  "nome": "Antimônio",
  "en": "ANTIMONY",
  "fam": "su",
  "ess": "Purificação.",
  "nuc": "Limpa venenos, doenças e corrupção.",
  "no": "Remove uma condição do alvo.",
  "nf": "purificando",
  "c": [
   "curar veneno",
   "clarear a mente",
   "limpar objetos",
   "purificar a alma",
   "limpar uma maldição antiga"
  ],
  "comb": "Água (cura), Sol (luz pura), Arsênico (antídoto)"
 },
 {
  "id": "arsenico",
  "nome": "Arsênico",
  "en": "ARSENIC",
  "fam": "su",
  "ess": "Veneno e doença.",
  "nuc": "Envenena, adoece, enfraquece.",
  "no": "Deixa o alvo envenenado.",
  "nf": "envenenando",
  "c": [
   "veneno no sangue",
   "paranoia, desconfiança",
   "envenenar comida e armas",
   "alma doente",
   "traição"
  ],
  "comb": "Amônia (gás venenoso), Ferro (lâmina envenenada), Vinagre"
 },
 {
  "id": "alcali",
  "nome": "Álcali",
  "en": "ALCALI",
  "fam": "su",
  "ess": "Anular e equilibrar.",
  "nuc": "Neutraliza magia, efeitos e emoções.",
  "no": "Cancela outro ritual.",
  "nf": "anulando",
  "c": [
   "anular um efeito no corpo",
   "acalmar, apagar emoções",
   "desfazer objetos mágicos",
   "cortar laços espirituais",
   "desfazer um presságio"
  ],
  "comb": "Selo (antimagia), Ácido (dissolver magia), Roda"
 },
 {
  "id": "alumen",
  "nome": "Alúmen",
  "en": "ALUMEN",
  "fam": "su",
  "ess": "Fixar e estancar.",
  "nuc": "Endurece, fixa, estanca sangue.",
  "no": "Deixa o ritual estável: não pode ser interrompido.",
  "nf": "fixo e estável",
  "c": [
   "estancar sangue",
   "fixar uma memória",
   "solidificar, endurecer",
   "prender a alma ao corpo",
   "fixar um acontecimento"
  ],
  "comb": "Terra (muralha), Fogo (arma flamejante), Água (congelar líquido)"
 },
 {
  "id": "amonia",
  "nome": "Amônia",
  "en": "AMMONIA",
  "fam": "su",
  "ess": "Gás e névoa.",
  "nuc": "Cria gás, fedor, névoa ou fumaça.",
  "no": "O efeito vira uma nuvem que fica no ar.",
  "nf": "em névoa",
  "c": [
   "gás que sufoca",
   "névoa que confunde",
   "encher um lugar de fumaça",
   "névoa dos mortos",
   "neblina que esconde o futuro"
  ],
  "comb": "Lua (névoa do sono), Arsênico (gás venenoso), Fogo (fumaça)"
 },
 {
  "id": "potassa",
  "nome": "Potassa",
  "en": "POTASH",
  "fam": "su",
  "ess": "Crescimento e vida vegetal.",
  "nuc": "Faz crescer plantas, raízes e coisas vivas.",
  "no": "O efeito cresce a cada rodada.",
  "nf": "crescendo",
  "c": [
   "raízes e espinhos",
   "esperança, ideias que crescem",
   "fazer brotar estruturas vivas",
   "fertilidade, vida nova",
   "um futuro que floresce"
  ],
  "comb": "Terra (prisão de raízes), Água (cura natural), Júpiter"
 },
 {
  "id": "fosforo",
  "nome": "Fósforo",
  "en": "PHOSPHORUS",
  "fam": "su",
  "ess": "Brilho e marca.",
  "nuc": "Cria luz fria, fogo-fátuo e marcas brilhantes.",
  "no": "Marca o alvo: ele brilha e fica fácil de achar.",
  "nf": "marcando",
  "c": [
   "marca brilhante no corpo",
   "fascínio, prender o olhar",
   "iluminar objetos",
   "guiar almas perdidas",
   "marcar alguém pelo destino"
  ],
  "comb": "Fogo (fogo-fátuo), Marte (alvo marcado), Lua"
 },
 {
  "id": "lapis",
  "nome": "Lápis-lazúli",
  "en": "LAPIS LAZULI",
  "fam": "su",
  "ess": "Visão e sabedoria.",
  "nuc": "Permite ver longe, enxergar o oculto ou saber algo.",
  "no": "Leva o alcance até onde a vista chega.",
  "nf": "até onde a vista alcança",
  "c": [
   "olhos aguçados",
   "ler pensamentos",
   "ver através de paredes",
   "ver espíritos",
   "ver o futuro"
  ],
  "comb": "Saturno (visão do destino), Mercúrio (passagem), Sol (revelar)"
 },
 {
  "id": "oleo",
  "nome": "Óleo",
  "en": "OLIVE OIL",
  "fam": "su",
  "ess": "Bênção e unção.",
  "nuc": "Abençoa, unge, faz deslizar ou serve de combustível.",
  "no": "Abençoa o alvo: o próximo esforço dele vai melhor.",
  "nf": "abençoado",
  "c": [
   "escorregar, deslizar",
   "confortar, dar coragem",
   "lubrificar, fazer funcionar",
   "consagrar, ungir",
   "sorte abençoada"
  ],
  "comb": "Fogo (combustível), Vênus (bênção num aliado), Sal"
 },
 {
  "id": "acido",
  "nome": "Ácido",
  "en": "SULPHURIC ACID",
  "fam": "su",
  "ess": "Dissolver e desfazer.",
  "nuc": "Dissolve matéria: derrete armaduras, objetos e barreiras.",
  "no": "Destrói as proteções do alvo.",
  "nf": "dissolvendo",
  "c": [
   "derreter carne e armadura",
   "desfazer certezas",
   "dissolver paredes e objetos",
   "desfazer a alma",
   "apagar um acontecimento"
  ],
  "comb": "Selo (quebrar selos), Ferro, Água"
 },
 {
  "id": "acafrao",
  "nome": "Açafrão",
  "en": "COPPER SAFRON",
  "fam": "su",
  "ess": "Maldição e marca permanente.",
  "nuc": "Amaldiçoa, mancha, deixa uma marca que não sai.",
  "no": "O efeito gruda no alvo e dura muito.",
  "nf": "amaldiçoado",
  "c": [
   "mancha que não sai",
   "obsessão, ideia fixa",
   "amaldiçoar objetos",
   "maldição na alma",
   "condenação"
  ],
  "comb": "Vinagre (podridão), Saturno (maldição lenta), Restos"
 },
 {
  "id": "roda",
  "nome": "Roda",
  "en": "COPPER ACETATE",
  "fam": "su",
  "ess": "Ciclo e retorno.",
  "nuc": "Faz algo voltar, repetir ou girar em ciclo.",
  "no": "Se o ritual falhar, a energia volta para você.",
  "nf": "que retorna",
  "c": [
   "girar, rodopiar",
   "lembrar, repetir memórias",
   "fazer girar mecanismos",
   "reencarnar",
   "voltar no tempo"
  ],
  "comb": "Saturno (voltar um instante), Latão (repetir), Urano (roleta)"
 }
];
/** [a, b, nome, leitura, uso] */
export const FUSOES: [string, string, string, string, string][] = [
 [
  "fogo",
  "terra",
  "Lava",
  "lava derretida",
  "chuva de lava, chão derretido"
 ],
 [
  "agua",
  "fogo",
  "Vapor",
  "vapor escaldante",
  "névoa que queima, cegar"
 ],
 [
  "ar",
  "fogo",
  "Labareda",
  "labaredas ao vento",
  "rajada ou redemoinho de chamas"
 ],
 [
  "agua",
  "ar",
  "Tempestade",
  "tempestade de chuva e vento",
  "chuva forte, ventania"
 ],
 [
  "agua",
  "terra",
  "Lama",
  "lama que afunda",
  "prender os pés, afundar"
 ],
 [
  "ar",
  "terra",
  "Areia",
  "areia e poeira no ar",
  "tempestade de areia, cegar"
 ],
 [
  "agua",
  "sal",
  "Gelo",
  "gelo cortante",
  "lança de gelo, congelar"
 ],
 [
  "ar",
  "cobre",
  "Relâmpago",
  "relâmpagos",
  "raio que salta entre alvos"
 ],
 [
  "potassa",
  "terra",
  "Raízes",
  "raízes e espinhos",
  "prisão de raízes"
 ],
 [
  "fogo",
  "fosforo",
  "Fogo-fátuo",
  "fogo-fátuo que não queima",
  "luz que guia ou marca"
 ],
 [
  "agua",
  "lua",
  "Reflexo",
  "reflexos e espelhos",
  "cópias ilusórias"
 ]
];
export const EXEMPLOS: Exemplo[] = [
 {
  "nome": "Bola de Fogo",
  "circ": "carne",
  "centro": "fogo",
  "nos": [
   "marte",
   "enxofre"
  ]
 },
 {
  "nome": "Bola de Fogo Negra",
  "circ": "carne",
  "centro": "fogo",
  "nos": [
   "marte",
   "netuno",
   "enxofre",
   "acafrao"
  ]
 },
 {
  "nome": "Punho de Impacto",
  "circ": "carne",
  "centro": "marte",
  "nos": [
   "sol",
   "salitre"
  ]
 },
 {
  "nome": "Chuva de Lava",
  "circ": "carne",
  "centro": "fogo",
  "nos": [
   "terra",
   "lanca",
   "mundo"
  ]
 },
 {
  "nome": "Lança de Gelo",
  "circ": "carne",
  "centro": "agua",
  "nos": [
   "sal",
   "ferro",
   "marte"
  ]
 },
 {
  "nome": "Tempestade de Raios",
  "circ": "carne",
  "centro": "ar",
  "nos": [
   "agua",
   "cobre",
   "mundo"
  ]
 },
 {
  "nome": "Lâmina de Vento",
  "circ": "carne",
  "centro": "ar",
  "nos": [
   "ferro",
   "mercurio"
  ]
 },
 {
  "nome": "Arma Flamejante",
  "circ": "forma",
  "centro": "fogo",
  "nos": [
   "ferro",
   "alumen"
  ]
 },
 {
  "nome": "Muralha de Pedra",
  "circ": "forma",
  "centro": "terra",
  "nos": [
   "mundo",
   "alumen"
  ]
 },
 {
  "nome": "Prisão de Raízes",
  "circ": "forma",
  "centro": "terra",
  "nos": [
   "potassa",
   "chumbo"
  ]
 },
 {
  "nome": "Passagem",
  "circ": "forma",
  "centro": "mercurio",
  "nos": [
   "estanho",
   "lapis"
  ]
 },
 {
  "nome": "Névoa do Sono",
  "circ": "espirito",
  "centro": "lua",
  "nos": [
   "amonia",
   "chumbo"
  ]
 },
 {
  "nome": "Duplo Ilusório",
  "circ": "espirito",
  "centro": "lua",
  "nos": [
   "agua",
   "sol"
  ]
 },
 {
  "nome": "Grito de Pavor",
  "circ": "espirito",
  "centro": "marte",
  "nos": [
   "latao",
   "jupiter"
  ]
 },
 {
  "nome": "Elo de Vida",
  "circ": "alma",
  "centro": "agua",
  "nos": [
   "venus",
   "estanho"
  ]
 },
 {
  "nome": "Maldição da Podridão",
  "circ": "alma",
  "centro": "acafrao",
  "nos": [
   "vinagre",
   "saturno"
  ]
 },
 {
  "nome": "Voz dos Mortos",
  "circ": "alma",
  "centro": "restos",
  "nos": [
   "mercurio",
   "lua"
  ]
 },
 {
  "nome": "Renascer",
  "circ": "aurora",
  "centro": "fogo",
  "nos": [
   "sol",
   "saturno"
  ]
 },
 {
  "nome": "Voltar um Instante",
  "circ": "aurora",
  "centro": "saturno",
  "nos": [
   "roda",
   "mercurio"
  ]
 },
 {
  "nome": "Visão do Destino",
  "circ": "aurora",
  "centro": "lapis",
  "nos": [
   "saturno",
   "lua"
  ]
 }
];
/** posição [x, y, raio] de cada nó nos desenhos originais (400×400), do topo em sentido horário */
export const POSICOES: Record<string, [number, number, number][]> = {
 "carne": [
  [
   200,
   43.2,
   28.6
  ],
  [
   284.8,
   118.9,
   28.6
  ],
  [
   350,
   200.8,
   28.6
  ],
  [
   277.3,
   278,
   28.6
  ],
  [
   200,
   360.6,
   28.6
  ],
  [
   123.5,
   277.3,
   28.6
  ],
  [
   50,
   200.8,
   28.6
  ],
  [
   112.9,
   118.2,
   28.6
  ]
 ],
 "espirito": [
  [
   203.6,
   46.1,
   29.1
  ],
  [
   311.1,
   85.7,
   29.1
  ],
  [
   353.9,
   196.4,
   29.1
  ],
  [
   306.3,
   309.5,
   29.1
  ],
  [
   198.8,
   357.2,
   29.1
  ],
  [
   84,
   309.5,
   29.1
  ],
  [
   46.1,
   197.2,
   29.1
  ],
  [
   97,
   97,
   29.1
  ]
 ],
 "forma": [
  [
   199.6,
   56.1,
   34.9
  ],
  [
   333.2,
   124.5,
   34.9
  ],
  [
   333.2,
   276.3,
   34.9
  ],
  [
   199.6,
   343.9,
   34.9
  ],
  [
   66.8,
   276.3,
   34.9
  ],
  [
   66.8,
   124.5,
   34.9
  ]
 ],
 "alma": [
  [
   199.3,
   38.1,
   28.7
  ],
  [
   303.6,
   82,
   28.7
  ],
  [
   351.1,
   197.8,
   28.7
  ],
  [
   303.6,
   313.7,
   28.7
  ],
  [
   200,
   359,
   28.7
  ],
  [
   97.1,
   324.5,
   28.7
  ],
  [
   48.9,
   203.6,
   28.7
  ],
  [
   96.4,
   82,
   28.7
  ]
 ],
 "aurora": [
  [
   197.8,
   64,
   28.8
  ],
  [
   346.9,
   133.1,
   28.8
  ],
  [
   292.4,
   325.8,
   28.8
  ],
  [
   108.4,
   321.5,
   28.8
  ],
  [
   53.1,
   156.4,
   28.8
  ]
 ]
};
/** anel extra desenhado por cima (só a Aurora): [x, y, raio, espessura] */
export const ANEIS: Record<string, number[]> = {
 "aurora": [
  197,
  202.8,
  144.6,
  11.3
 ]
};
