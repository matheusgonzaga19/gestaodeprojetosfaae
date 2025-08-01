import { User, UserRole, Task, Priority, Status } from './types';

export const USERS: User[] = [
  { id: 1, name: 'Líder Admin', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/48?u=1' },
  { id: 2, name: 'Ana Silva', role: UserRole.COLLABORATOR, avatar: 'https://i.pravatar.cc/48?u=2' },
  { id: 3, name: 'Bruno Costa', role: UserRole.COLLABORATOR, avatar: 'https://i.pravatar.cc/48?u=3' },
  { id: 4, name: 'Carlos Dias', role: UserRole.COLLABORATOR, avatar: 'https://i.pravatar.cc/48?u=4' },
  { id: 5, name: 'Daniela Faria', role: UserRole.COLLABORATOR, avatar: 'https://i.pravatar.cc/48?u=5' },
  { id: 6, name: 'Eduarda Lima', role: UserRole.COLLABORATOR, avatar: 'https://i.pravatar.cc/48?u=6' },
];

const now = new Date();
const historyEntry = (name: string) => ({ date: now.toISOString(), user: name, changes: 'Tarefa criada.' });

export const TASKS: Task[] = [
  {
    id: 1,
    userId: 2,
    title: 'Revisão dos blueprints do Edifício Central',
    description: 'Verificar todas as plantas baixas e elevações para conformidade com o código de construção municipal. Foco na acessibilidade.',
    priority: Priority.ALTA,
    startDate: '2024-07-15',
    dueDate: '2024-07-25',
    status: Status.CONCLUIDA,
    project: 'Edifício Central',
    files: [{name: 'plantas_rev01.pdf', size: 12582912}],
    createdAt: '2024-07-14T10:00:00.000Z',
    completedAt: '2024-07-24T18:00:00.000Z',
    history: [historyEntry('Ana Silva'), { date: '2024-07-24T18:00:00.000Z', user: 'Ana Silva', changes: 'Status alterado para Concluída.' }],
  },
  {
    id: 2,
    userId: 3,
    title: 'Modelagem 3D da fachada do Shopping Norte',
    description: 'Criar modelo 3D detalhado da fachada oeste, incluindo materiais e texturas conforme especificado pelo cliente.',
    priority: Priority.MEDIA,
    startDate: '2024-07-18',
    dueDate: '2024-08-05',
    status: Status.EM_ANDAMENTO,
    project: 'Shopping Norte',
    createdAt: '2024-07-18T09:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Bruno Costa')],
  },
  {
    id: 3,
    userId: 4,
    title: 'Orçamento para o projeto residencial Vila Madalena',
    description: 'Levantar custos de materiais e mão de obra para a construção da residência. Contatar 3 fornecedores para cada item.',
    priority: Priority.MEDIA,
    startDate: '2024-07-20',
    dueDate: '2024-07-30',
    status: Status.ABERTA,
    project: 'Residencial Vila Madalena',
    createdAt: '2024-07-20T11:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Carlos Dias')],
  },
  {
    id: 4,
    userId: 2,
    title: 'Preparar documentação para licitação da prefeitura',
    description: 'Compilar todos os documentos técnicos e certidões necessários para a licitação da nova praça pública.',
    priority: Priority.ALTA,
    startDate: '2024-07-22',
    dueDate: '2024-08-10',
    status: Status.EM_ANDAMENTO,
    project: 'Praça Pública Central',
    files: [{name: 'edital_licitacao.pdf', size: 8388608}, {name: 'certidoes.zip', size: 20971520}],
    createdAt: '2024-07-22T08:30:00.000Z',
    completedAt: null,
    history: [historyEntry('Ana Silva')],
  },
   {
    id: 5,
    userId: 5,
    title: 'Desenho de interiores para o escritório da InovaTech',
    description: 'Propor layout, mobiliário e paleta de cores para o novo escritório da InovaTech, com foco em espaços colaborativos.',
    priority: Priority.MEDIA,
    startDate: '2024-07-25',
    dueDate: '2024-08-15',
    status: Status.ABERTA,
    project: 'Escritório InovaTech',
    createdAt: '2024-07-25T14:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Daniela Faria')],
  },
  {
    id: 6,
    userId: 6,
    title: 'Estudo de viabilidade para o Condomínio Green Valley',
    description: 'Analisar o terreno, legislação local e potencial de mercado para o novo condomínio residencial.',
    priority: Priority.ALTA,
    startDate: '2024-08-01',
    dueDate: '2024-08-20',
    status: Status.ABERTA,
    project: 'Condomínio Green Valley',
    createdAt: '2024-08-01T10:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Eduarda Lima')],
  },
  {
    id: 7,
    userId: 3,
    title: 'Renderizações fotorrealistas do lobby do Hotel Marítimo',
    description: 'Produzir 5 renderizações de alta qualidade do projeto de interiores do lobby.',
    priority: Priority.MEDIA,
    startDate: '2024-08-02',
    dueDate: '2024-08-12',
    status: Status.EM_ANDAMENTO,
    project: 'Hotel Marítimo',
    createdAt: '2024-08-02T09:30:00.000Z',
    completedAt: null,
    history: [historyEntry('Bruno Costa')],
  },
  {
    id: 8,
    userId: 4,
    title: 'Compatibilização de projetos do Hospital Municipal',
    description: 'Verificar interferências entre os projetos de arquitetura, estrutura e instalações (elétrica, hidráulica).',
    priority: Priority.ALTA,
    startDate: '2024-08-05',
    dueDate: '2024-08-25',
    status: Status.ABERTA,
    project: 'Hospital Municipal',
    createdAt: '2024-08-05T09:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Carlos Dias')],
  },
  {
    id: 9,
    userId: 5,
    title: 'Seleção de acabamentos para a loja Conceito',
    description: 'Montar moodboard e selecionar pisos, revestimentos e metais para a nova loja no Jardins.',
    priority: Priority.BAIXA,
    startDate: '2024-08-07',
    dueDate: '2024-08-18',
    status: Status.ABERTA,
    project: 'Loja Conceito',
    createdAt: '2024-08-07T15:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Daniela Faria')],
  },
  {
    id: 10,
    userId: 2,
    title: 'Ajustes no projeto executivo do Edifício Central',
    description: 'Incorporar as últimas solicitações do cliente no projeto executivo e atualizar as pranchas.',
    priority: Priority.MEDIA,
    startDate: '2024-08-11',
    dueDate: '2024-08-16',
    status: Status.ABERTA,
    project: 'Edifício Central',
    createdAt: '2024-08-11T11:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Ana Silva')],
  },
  {
    id: 11,
    userId: 6,
    title: 'Paisagismo para a área comum do Condomínio Green Valley',
    description: 'Projetar as áreas verdes, piscina e espaços de convivência do condomínio.',
    priority: Priority.MEDIA,
    startDate: '2024-08-21',
    dueDate: '2024-09-10',
    status: Status.ABERTA,
    project: 'Condomínio Green Valley',
    createdAt: '2024-08-21T09:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Eduarda Lima')],
  },
  {
    id: 12,
    userId: 3,
    title: 'Correção de maquete eletrônica do Shopping Norte',
    description: 'Ajustar iluminação e materiais na maquete 3D conforme feedback da reunião.',
    priority: Priority.BAIXA,
    startDate: '2024-08-06',
    dueDate: '2024-08-09',
    status: Status.CONCLUIDA,
    project: 'Shopping Norte',
    createdAt: '2024-08-06T10:00:00.000Z',
    completedAt: '2024-08-08T16:00:00.000Z',
    history: [historyEntry('Bruno Costa'), { date: '2024-08-08T16:00:00.000Z', user: 'Bruno Costa', changes: 'Status alterado para Concluída.' }],
  },
  {
    id: 13,
    userId: 4,
    title: 'Memorial descritivo - Residencial Vila Madalena',
    description: 'Redigir o memorial descritivo completo da obra, especificando todos os materiais e técnicas construtivas.',
    priority: Priority.MEDIA,
    startDate: '2024-08-01',
    dueDate: '2024-08-14',
    status: Status.EM_ANDAMENTO,
    project: 'Residencial Vila Madalena',
    createdAt: '2024-08-01T14:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Carlos Dias')],
  },
  {
    id: 14,
    userId: 5,
    title: 'Pesquisa de mobiliário corporativo - InovaTech',
    description: 'Pesquisar e orçar estações de trabalho, cadeiras ergonômicas e móveis para áreas de descompressão.',
    priority: Priority.BAIXA,
    startDate: '2024-08-16',
    dueDate: '2024-08-26',
    status: Status.ABERTA,
    project: 'Escritório InovaTech',
    createdAt: '2024-08-16T10:30:00.000Z',
    completedAt: null,
    history: [historyEntry('Daniela Faria')],
  },
  {
    id: 15,
    userId: 6,
    title: 'Detalhamento das esquadrias do Hospital Municipal',
    description: 'Desenhar todos os detalhes de portas e janelas, incluindo especificações técnicas.',
    priority: Priority.ALTA,
    startDate: '2024-08-26',
    dueDate: '2024-09-15',
    status: Status.ABERTA,
    project: 'Hospital Municipal',
    createdAt: '2024-08-26T09:00:00.000Z',
    completedAt: null,
    history: [historyEntry('Eduarda Lima')],
  },
];