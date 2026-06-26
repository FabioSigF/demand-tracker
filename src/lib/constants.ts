import { Status } from '@/types';

export const STATUSES: Status[] = [
  'Pendente', 'Em andamento', 'Concluído', 'Cancelado'
];

export const OPERATION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Cielo:      { bg: 'bg-sky-100 dark:bg-sky-900/40',       text: 'text-sky-700 dark:text-sky-300',       dot: 'bg-sky-500' },
  Onfly:      { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  Bradesco:   { bg: 'bg-red-950/80 dark:bg-red-950/60',    text: 'text-red-100',                         dot: 'bg-red-900' },
  Luxottica:  { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  Claro:      { bg: 'bg-red-100 dark:bg-red-900/40',       text: 'text-red-600 dark:text-red-300',       dot: 'bg-red-500' },
  Banese:     { bg: 'bg-green-950/80 dark:bg-green-950/60',text: 'text-green-100',                       dot: 'bg-green-900' },
  'Banco BV': { bg: 'bg-blue-950/80 dark:bg-blue-950/60', text: 'text-blue-100',                        dot: 'bg-blue-900' },
  Pluxee:     { bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-300',   dot: 'bg-green-500' },
  Outro:      { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-600 dark:text-gray-300',     dot: 'bg-gray-500' },
};

export const COLOR_SCHEMES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', label: 'Sky (Suave)' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', label: 'Roxo (Suave)' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', label: 'Laranja (Suave)' },
  red: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-600 dark:text-red-300', dot: 'bg-red-500', label: 'Vermelho (Suave)' },
  green: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500', label: 'Verde (Suave)' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500', label: 'Rosa (Suave)' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500', label: 'Indigo (Suave)' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500', label: 'Teal (Suave)' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-500', label: 'Cinza (Suave)' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', label: 'Azul (Suave)' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Esmeralda (Suave)' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', label: 'Rose (Suave)' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', label: 'Âmbar (Suave)' },
  'red-dark': { bg: 'bg-red-950/80 dark:bg-red-950/60', text: 'text-red-100', dot: 'bg-red-900', label: 'Vermelho (Escuro)' },
  'green-dark': { bg: 'bg-green-950/80 dark:bg-green-950/60', text: 'text-green-100', dot: 'bg-green-900', label: 'Verde (Escuro)' },
  'blue-dark': { bg: 'bg-blue-950/80 dark:bg-blue-950/60', text: 'text-blue-100', dot: 'bg-blue-900', label: 'Azul (Escuro)' },
};

const DEFAULT_COLORS = [
  { bg: 'bg-sky-100 dark:bg-sky-900/40',       text: 'text-sky-700 dark:text-sky-300',       dot: 'bg-sky-500' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-red-100 dark:bg-red-900/40',       text: 'text-red-600 dark:text-red-300',       dot: 'bg-red-500' },
  { bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-300',   dot: 'bg-green-500' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40',     text: 'text-pink-700 dark:text-pink-300',     dot: 'bg-pink-500' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-100 dark:bg-teal-900/40',     text: 'text-teal-700 dark:text-teal-300',     dot: 'bg-teal-500' },
];

export function getOperationColor(name: string, color?: string) {
  if (color && color in COLOR_SCHEMES) {
    return COLOR_SCHEMES[color];
  }
  if (name in OPERATION_COLORS) {
    return OPERATION_COLORS[name];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[idx];
}

export const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> = {
  'Pendente':    { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Em andamento':{ bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
  'Concluído':   { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500' },
  'Cancelado':   { bg: 'bg-red-100 dark:bg-red-900/40',      text: 'text-red-600 dark:text-red-400',      dot: 'bg-red-500' },
};

export const ACTIVE_STATUSES: Status[] = ['Pendente', 'Em andamento'];
export const DONE_STATUSES: Status[] = ['Concluído', 'Cancelado'];

export const DEBOUNCE_MS = 2000;

export const DOCUMENTATION_CATEGORIES = [
  { id: 'sistema', label: 'Sistema / Ferramenta' },
  { id: 'processo', label: 'Processo (BABOK)' },
  { id: 'requisito', label: 'Requisito (BABOK)' },
  { id: 'regra_negocio', label: 'Regra de Negócio (BABOK)' },
  { id: 'procedimento', label: 'Procedimento' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'integracao', label: 'Integração (BABOK)' },
  { id: 'geral', label: 'Geral (Sem Template)' },
] as const;

export const TEMPLATE_SISTEMA = `
<h1>Visão Geral</h1>
<p>Descrição resumida do sistema.</p>
<hr />
<h1>Objetivo</h1>
<p>Qual problema o sistema resolve?</p>
<hr />
<h1>Operações Relacionadas</h1>
<p>Quais operações utilizam esta ferramenta?</p>
<hr />
<h1>Usuários</h1>
<p>Quem utiliza o sistema?</p>
<ul>
  <li>Analistas</li>
  <li>Supervisores</li>
  <li>Gestores</li>
  <li>Clientes</li>
  <li>Terceiros</li>
</ul>
<hr />
<h1>Perfis de Acesso</h1>
<p>Perfis existentes e permissões.</p>
<table>
  <thead>
    <tr>
      <th>Perfil</th>
      <th>Permissões</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>[Perfil]</td>
      <td>[Permissões]</td>
    </tr>
  </tbody>
</table>
<hr />
<h1>Fluxo de Utilização</h1>
<p>Passo a passo resumido do uso da ferramenta.</p>
<hr />
<h1>Funcionalidades Principais</h1>
<ul>
  <li>Funcionalidade 1</li>
  <li>Funcionalidade 2</li>
  <li>Funcionalidade 3</li>
</ul>
<hr />
<h1>Integrações</h1>
<p>Sistemas relacionados.</p>
<table>
  <thead>
    <tr>
      <th>Sistema</th>
      <th>Finalidade</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>[Sistema]</td>
      <td>[Finalidade]</td>
    </tr>
  </tbody>
</table>
<hr />
<h1>URLs e Ambientes</h1>
<table>
  <thead>
    <tr>
      <th>Ambiente</th>
      <th>URL</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Produção</td>
      <td></td>
    </tr>
    <tr>
      <td>Homologação</td>
      <td></td>
    </tr>
    <tr>
      <td>Desenvolvimento</td>
      <td></td>
    </tr>
  </tbody>
</table>
<hr />
<h1>Contatos</h1>
<p>Responsáveis pela ferramenta.</p>
<table>
  <thead>
    <tr>
      <th>Nome</th>
      <th>Área</th>
      <th>Contato</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>
`;

export const TEMPLATE_PROCESSO = `
<h1>Definição do Processo</h1>
<p>Visão geral do processo de negócio.</p>
<hr />
<h2>Atores Envolvidos</h2>
<p>Quem executa ou é afetado por este processo.</p>
<hr />
<h2>Gatilho (Trigger)</h2>
<p>O evento que inicia o processo.</p>
<hr />
<h2>Fluxo do Processo (Passo a Passo)</h2>
<ol>
  <li>Passo 1</li>
  <li>Passo 2</li>
</ol>
<hr />
<h2>Regras de Transição</h2>
<p>Critérios de entrada e saída de cada etapa.</p>
<hr />
<h2>Exceções</h2>
<p>O que fazer se o fluxo principal falhar.</p>
`;

export const TEMPLATE_REQUISITO = `
<h1>Especificação de Requisito</h1>
<p><strong>ID/Código:</strong> REQ-001</p>
<p><strong>Título:</strong> Descrição sucinta do requisito.</p>
<hr />
<h2>Descrição</h2>
<p>Detalhamento do que o sistema deve fazer.</p>
<hr />
<h2>Critérios de Aceite</h2>
<ul>
  <li>Critério 1</li>
  <li>Critério 2</li>
</ul>
<hr />
<h2>História de Usuário (User Story)</h2>
<p><strong>Como:</strong> [Perfil de usuário]</p>
<p><strong>Eu quero:</strong> [Ação ou funcionalidade]</p>
<p><strong>Para que:</strong> [Valor de negócio/objetivo]</p>
`;

export const TEMPLATE_REGRA_NEGOCIO = `
<h1>Regra de Negócio</h1>
<p><strong>Código:</strong> RN-001</p>
<p><strong>Nome:</strong> Título da regra de negócio.</p>
<hr />
<h2>Definição</h2>
<p>Descrição exata da regra ou restrição de negócio.</p>
<hr />
<h2>Exemplo Prático</h2>
<p>Cenários onde esta regra se aplica.</p>
<hr />
<h2>Impacto</h2>
<p>Quais fluxos e funcionalidades do sistema são afetados por esta regra.</p>
`;

export const TEMPLATE_PROCEDIMENTO = `
<h1>Procedimento Operacional Padrão (POP)</h1>
<p><strong>Objetivo:</strong> Descrição do que será executado e por quê.</p>
<hr />
<h2>Pré-requisitos</h2>
<p>O que é necessário antes de iniciar o procedimento (acessos, ferramentas, dados).</p>
<hr />
<h2>Passo a Passo</h2>
<ol>
  <li>Acessar o sistema...</li>
  <li>Clicar na opção...</li>
  <li>Preencher o formulário...</li>
</ol>
<hr />
<h2>Ações Pós-Execução</h2>
<p>O que deve ser verificado ou registrado após o término.</p>
`;

export const TEMPLATE_TROUBLESHOOTING = `
<h1>Guia de Resolução de Problemas (Troubleshooting)</h1>
<hr />
<h2>Sintoma do Problema</h2>
<p>Descrição do erro apresentado ou comportamento inesperado relatado pelo usuário.</p>
<hr />
<h2>Causas Prováveis</h2>
<ul>
  <li>Causa A</li>
  <li>Causa B</li>
</ul>
<hr />
<h2>Passos para Resolução</h2>
<h3>Cenário A</h3>
<ol>
  <li>Ação 1</li>
  <li>Ação 2</li>
</ol>
<h3>Cenário B</h3>
<ol>
  <li>Ação 1</li>
</ol>
<hr />
<h2>Como Prevenir</h2>
<p>Melhores práticas para evitar a recorrência deste problema.</p>
`;

export const TEMPLATE_INTEGRACAO = `
<h1>Especificação de Integração</h1>
<p><strong>Sistema Origem:</strong> </p>
<p><strong>Sistema Destino:</strong> </p>
<hr />
<h2>Método de Integração</h2>
<p>API REST, SOAP, Kafka, RabbitMQ, Arquivo (SFTP), Banco a Banco, etc.</p>
<hr />
<h2>Endpoints / Contrato</h2>
<p>URLs, Métodos HTTP (GET, POST), Headers, etc.</p>
<hr />
<h2>Mapeamento de Dados</h2>
<table>
  <thead>
    <tr>
      <th>Campo Origem</th>
      <th>Campo Destino</th>
      <th>Tipo/Regra</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>
`;

export const TEMPLATE_GERAL = `
<p>Comece a escrever aqui sua documentação...</p>
`;

export const DOCUMENTATION_TEMPLATES: Record<string, string> = {
  sistema: TEMPLATE_SISTEMA,
  processo: TEMPLATE_PROCESSO,
  requisito: TEMPLATE_REQUISITO,
  regra_negocio: TEMPLATE_REGRA_NEGOCIO,
  procedimento: TEMPLATE_PROCEDIMENTO,
  troubleshooting: TEMPLATE_TROUBLESHOOTING,
  integracao: TEMPLATE_INTEGRACAO,
  geral: TEMPLATE_GERAL,
};

