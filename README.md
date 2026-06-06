# Demand Tracker

Demand Tracker é uma aplicação SaaS moderna, de alto desempenho e design premium para controle de demandas e registro de tempo para Analistas de Negócio. Totalmente serverless, com persistência em tempo real e autenticação integradas diretamente com o Firebase, hospedada de forma 100% gratuita na Vercel Free.

---

## Recursos Principais

- **Login e Recuperação de Senha**: Segurança integrada com Firebase Authentication (e-mail/senha).
- **Quadro de Demandas Inline**: Edição em tempo real "clique-e-edite" no estilo Airtable/Notion, com abas dedicadas para demandas ativas ("Em Atendimento") e "Finalizadas".
- **Autosave Inteligente**: Mudanças em campos curtos são salvas imediatamente; campos mais longos de texto utilizam debounce de 2 segundos.
- **Drag & Drop**: Reordenamento de demandas persistido no Firestore.
- **Timer Persistente**: Cronômetro por demanda que continua rodando mesmo após fechar o navegador, trocar de aba ou desligar o computador.
- **História em Rich-Text**: Editor de texto integrado (Tiptap) com suporte a Markdown, checklists, negrito, itálico, cabeçalhos, etc.
- **Módulo de Analytics**: Painel com gráficos interativos (Pizza e Barras) de tempo registrado por dia e por operação com períodos flexíveis.
- **Sistema de Alarmes**: Cadastro de lembretes importantes com notificações integradas à API nativa do Browser.
- **Tema Claro & Escuro**: Layout premium adaptável com persistência automática de tema.

---

## Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Clique em **Adicionar Projeto** e crie um novo projeto.
3. No menu lateral, acesse **Build > Authentication**, clique em **Começar** e ative o provedor **E-mail/Senha**.
4. Acesse **Build > Firestore Database**, clique em **Criar banco de dados** e selecione a região mais próxima de você. Inicialize em modo de teste ou produção.
5. Registre um **Aplicativo Web** nas configurações do projeto para obter suas credenciais de configuração.

---

## Instalação e Execução Local

### 1. Clonar e configurar as Variáveis de Ambiente
Crie um arquivo chamado `.env.local` na raiz do projeto e preencha-o com as credenciais obtidas no Firebase Console:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

### 2. Instalar as dependências do projeto
```bash
npm install
```

### 3. Rodar o servidor de desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## Regras de Segurança e Índices do Firestore

Recomendamos instalar a [Firebase CLI](https://firebase.google.com/docs/cli) e fazer o deploy das regras e índices diretamente:

```bash
# Efetuar login no firebase
firebase login

# Inicializar o projeto vinculando ao ID do projeto criado
firebase use --add

# Enviar as Regras de Segurança do Firestore
firebase deploy --only firestore:rules

# Enviar os Índices do Firestore
firebase deploy --only firestore:indexes
```

Você também pode copiar o conteúdo do arquivo `firestore.rules` e colar diretamente na aba **Rules** do console do Firestore, e configurar os índices listados em `firestore.indexes.json` na aba **Indexes**.

---

## Deploy na Vercel Free

1. Crie uma conta ou faça login na [Vercel](https://vercel.com/).
2. Conecte seu repositório Git ou utilize a Vercel CLI para fazer o upload do projeto.
3. Nas configurações do projeto na Vercel, adicione as mesmas **Variáveis de Ambiente** do seu arquivo `.env.local`.
4. Clique em **Deploy**. A Vercel cuidará do build de produção e entregará um endereço público seguro `https` gratuitamente.
