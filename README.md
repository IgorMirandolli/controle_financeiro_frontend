# Controle Financeiro - Frontend

Dashboard responsivo para acompanhar receitas, despesas, saldo e categorias. A interface consome uma API REST e apresenta os dados em cards, listas e graficos interativos.

![HTML5](https://img.shields.io/badge/HTML5-20232A?style=for-the-badge&logo=html5&logoColor=E34F26)
![CSS3](https://img.shields.io/badge/CSS3-20232A?style=for-the-badge&logo=css3&logoColor=1572B6)
![JavaScript](https://img.shields.io/badge/JavaScript-20232A?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Chart.js](https://img.shields.io/badge/Chart.js-20232A?style=for-the-badge&logo=chart.js&logoColor=FF6384)

## Interface

![Dashboard do Controle Financeiro](./docs/images/dashboard.png)

![Layout responsivo](./docs/images/responsivo.png)

## Funcionalidades

- Cards com saldo, receitas e despesas
- Cadastro e edicao de lancamentos
- Listagem das transacoes recentes
- Filtros por periodo e categoria
- Navegacao entre dashboard, receitas, despesas e categorias
- Grafico mensal de entradas e saidas
- Grafico de despesas por categoria
- Estados de carregamento, erro e lista vazia
- Layout adaptado para desktop e dispositivos moveis

## Tecnologias

- HTML5 semantico
- CSS3 responsivo
- JavaScript
- Fetch API
- Chart.js

## Estrutura

```text
css/
  styles.css            # Layout, componentes e responsividade
js/
  app.js                # Estado, integracao com a API e interacoes
vendor/
  chart.umd.min.js      # Biblioteca de graficos
index.html              # Estrutura principal da interface
```

## Como executar

Este frontend foi preparado para funcionar junto do backend. Mantenha os dois repositorios lado a lado:

```text
controle_financeiro/
  controle_financeiro_backend/
  controle_financeiro_frontend/
```

Clone os projetos:

```bash
git clone https://github.com/IgorMirandolli/controle_financeiro_backend.git
git clone https://github.com/IgorMirandolli/controle_financeiro_frontend.git
```

Depois, execute o backend:

```bash
cd controle_financeiro_backend
npm install
npm run db:setup
npm start
```

Abra `http://localhost:3000`. O backend entrega os arquivos do frontend e a interface usa a API pelo caminho `/api`.

## Integracao com a API

As principais fontes de dados da interface sao:

- `/api/health`
- `/api/categories`
- `/api/transactions`
- `/api/dashboard/summary`

O frontend e o backend usam a mesma origem em producao, evitando configuracao manual de URL e problemas de CORS.

## Repositorios relacionados

- [Backend API](https://github.com/IgorMirandolli/controle_financeiro_backend)
- [Versao para Railway](https://github.com/IgorMirandolli/controle_financeiro_railway)

## Autor

Desenvolvido por [Igor Mirandolli](https://github.com/IgorMirandolli).
