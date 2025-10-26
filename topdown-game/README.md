# Top-Down Game

Este projeto é um jogo top-down desenvolvido em TypeScript. O objetivo é criar uma experiência de jogo envolvente, utilizando um motor de jogo que gera mapas a partir de assets disponíveis.

## Estrutura do Projeto

- **src/**: Contém o código-fonte do jogo.
  - **index.ts**: Ponto de entrada do jogo.
  - **game.ts**: Gerencia o ciclo de vida do jogo.
  - **config/**: Configurações do jogo.
  - **engine/**: Contém classes para geração de mapas e carregamento de tilesets.
  - **assets/**: Funções para carregar assets do jogo.
  - **scenes/**: Define as diferentes cenas do jogo.
  - **entities/**: Contém as entidades do jogo, como o jogador.
  - **systems/**: Funções para renderização do jogo.
  - **utils/**: Funções utilitárias.

- **assets/**: Pasta que contém todos os assets do jogo, incluindo tilesets, sprites, áudio e metadados.

- **public/**: Contém o arquivo HTML que carrega o jogo no navegador.

- **tools/**: Ferramentas auxiliares, como um organizador de assets.

- **tests/**: Contém testes para garantir a funcionalidade do código.

## Como Executar o Jogo

1. Clone o repositório.
2. Navegue até a pasta do projeto.
3. Instale as dependências com `npm install`.
4. Execute o projeto com `npm run dev`.

## Contribuição

Sinta-se à vontade para contribuir com melhorias e correções. Para isso, crie um fork do repositório e envie um pull request.

## Licença

Este projeto está licenciado sob a MIT License.