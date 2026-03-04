# 💰 Controle Financeiro Pessoal

Aplicativo web completo para **gerenciamento de finanças pessoais**, desenvolvido com HTML5, CSS3 e JavaScript puro (Vanilla JS). Sem dependências externas, 100% no navegador.

---

## ✨ Funcionalidades

- 📊 **Dashboard financeiro** com saldo atual, total de receitas e total de despesas exibidos em cards visuais
- ➕ **Cadastro de transações** com descrição, valor, tipo (Receita/Despesa), categoria e data
- 📋 **Lista de transações** ordenada da mais recente para a mais antiga, com receitas em verde e despesas em vermelho
- 🗑️ **Exclusão** de qualquer transação com confirmação
- 🔍 **Filtros combinados** por tipo, categoria e período (data inicial/final)
- 💾 **Persistência via LocalStorage** — os dados ficam salvos no navegador mesmo após fechar ou recarregar a página
- 📱 **Design totalmente responsivo** (mobile-first)

---

## 🗂️ Categorias

| Receitas       | Despesas                          |
|----------------|-----------------------------------|
| Salário        | Alimentação                       |
| Freelance      | Transporte                        |
| Investimentos  | Moradia                           |
| Vendas         | Saúde                             |
| Outros         | Educação                          |
|                | Lazer                             |
|                | Roupas                            |
|                | Contas (água, luz, internet)      |
|                | Outros                            |

---

## 🚀 Como usar

1. **Clone ou baixe** este repositório.
2. Abra o arquivo `index.html` diretamente no navegador (não é necessário servidor).
3. Preencha o formulário e clique em **Adicionar Transação**.
4. Use os filtros para encontrar transações específicas.
5. Clique em **🗑️ Excluir** para remover uma transação.

> Todos os dados são salvos automaticamente no LocalStorage do seu navegador.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Uso |
|------------|-----|
| **HTML5** semântico | Estrutura da página |
| **CSS3** (Flexbox, Grid, Custom Properties) | Estilização e responsividade |
| **JavaScript ES6+** | Lógica da aplicação |
| **LocalStorage** (Web API) | Persistência de dados |
| **Google Fonts — Poppins** | Tipografia |

---

## 📁 Estrutura do projeto

```
📦 meurepositorio-rafaalcantara
 ┣ 📄 index.html    — Estrutura HTML da aplicação
 ┣ 📄 styles.css    — Estilização completa (design moderno e responsivo)
 ┣ 📄 app.js        — Lógica: CRUD, filtros, formatação, LocalStorage
 ┗ 📄 README.md     — Documentação do projeto
```

---

## 📸 Destaques do design

- Paleta financeira: **azul-escuro**, **verde** (receitas) e **vermelho** (despesas)
- Fonte **Poppins** (Google Fonts)
- Cards com hover animado
- Formulário com validação em tempo real
- Interface 100% em **Português do Brasil**
- Moeda formatada como **R$ 1.234,56**
- Datas no formato **DD/MM/AAAA**

---

Feito com ❤️ e JavaScript puro.
