# Abismio

Fichas de personagem para o RPG **Abismo**: atributos com os símbolos dos elementos, perícias com rolagem automática, mesas, rituais e o livro de regras, tudo no navegador.

Feito com **Vite + React + TypeScript**, usando React Router, Zustand, react-markdown e Three.js (fundo 3D).

- **Personagens**: cada personagem existe sozinho; não precisa de mesa.
- **Mesas**: juntam personagens que já existem (um personagem pode estar em várias mesas). Em cada mesa, **Convidar jogadores** gera um código e um link; o jogador abre (ou usa **Entrar com código**) e escolhe o personagem dele. *Por enquanto é demonstração: só encontra mesas salvas no mesmo navegador.*
- **Rituais**: o círculo do Abismo. No **Altar** os jogadores arrastam os símbolos para o círculo e veem a leitura. O **Grimório do mestre** (senha `abismo`, em [src/pages/Rituais.tsx](src/pages/Rituais.tsx)) mostra o significado dos 40 símbolos, exemplos e o criador: o ritual montado vai para a **Biblioteca** com o desenho e pode ser adicionado nas fichas. Os dados dos símbolos ficam em [src/lib/altarDados.ts](src/lib/altarDados.ts).
- **Livro**: mostra o PDF do livro. Arraste o PDF na página (fica salvo no navegador) ou coloque em `public/livro.pdf` para ele ir junto com o site.
- **Ficha**: identidade, barras (Vida, Sanidade, Esforço, Sede, Fome), os atributos em volta do redemoinho do Abismo (cada um com o símbolo do seu elemento), perícias por atributo, proficiências e abas Pacto, Combate, Habilidades de nível, Rituais, Inventário e Anotações. Atributos, perícias, barras e símbolos se configuram em **Sistema**.
- **Perícias**: clique na rolagem para rolar. A ficha mostra a conta de cada uma:

  | Treino | Rolagem |
  |---|---|
  | 0 | 1d20 + atributo + bônus |
  | 1–2 Conhece | 1d20 + atributo + perícia + bônus |
  | 3–4 Treinado, 5–9 Perito, 10 Mestre | um d20 por ponto do atributo, fica com o maior, + perícia + bônus |
- **Fundo**: árvore 3D em [src/components/FundoArvore.tsx](src/components/FundoArvore.tsx). Cores, tamanho e quantidade de pétalas ficam nesse arquivo.

## Comandos

```bash
npm install      # só na primeira vez
npm run dev      # abre em http://localhost:5173 e recarrega sozinho quando você edita o código
npm run build    # gera a versão final na pasta dist/
npm run preview  # testa a versão final
```

## Onde está cada coisa

| Pasta / arquivo | O que tem |
|---|---|
| `src/store.ts` | Dados e ações (criar mesa, ficha, ritual...). Também o **sistema padrão** (atributos, perícias, recursos). |
| `src/types.ts` | Formato de cada coisa (Ficha, Mesa, Ritual, Capítulo). |
| `src/pages/` | Uma página por aba: Mesas, Mesa, Ficha, Rituais, Livro, Sistema. |
| `src/components/` | Peças reutilizáveis (modal, cartão de ritual, campo numérico...). |
| `src/styles.css` | Todo o visual. As cores ficam no topo (`:root`). |

## Dados

Os dados ficam salvos no navegador (localStorage). Para não perder nada, use **Sistema → Exportar tudo** de vez em quando.
Cada ficha também pode ser exportada e importada em outra mesa (os rituais dela vão junto).
