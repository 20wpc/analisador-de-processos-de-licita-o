
import type { CompanyData } from '../types';

export interface DeclarationDefinition {
  id: string;
  name: string;
  type: 'common' | 'specific_dispensation';
  // The 'template' function is removed as AI will now generate the content dynamically.
  // We keep 'id', 'name', and 'type' for UI listing and selection.
}

// The commonPlaceholders and formatDate functions are no longer directly used here
// as the AI will be instructed to include such details or placeholders.

export const ALL_DECLARATIONS: DeclarationDefinition[] = [
  // Declarações Comuns
  {
    id: 'idoneidade',
    name: 'Declaração de Idoneidade',
    type: 'common',
  },
  {
    id: 'regras_trabalhistas',
    name: 'Declaração de Cumprimento das Regras Trabalhistas e Previdenciárias',
    type: 'common',
  },
  {
    id: 'nao_trabalho_infantil',
    name: 'Declaração de Não Utilização de Trabalho Infantil',
    type: 'common',
  },
   {
    id: 'nao_impedimento_legal',
    name: 'Declaração de Não Existência de Impedimento Legal',
    type: 'common',
  },
  {
    id: 'capacidade_tecnico_financeira',
    name: 'Declaração de Capacidade Técnico-Financeira',
    type: 'common',
  },
  {
    id: 'nao_contratos_suspeitos',
    name: 'Declaração de Não Existência de Contratos Suspeitos (Conflito de Interesses)',
    type: 'common',
  },
   {
    id: 'nao_condicoes_inabilitacao',
    name: 'Declaração de Não Existência de Condições de Inabilitação',
    type: 'common',
  },
  {
    id: 'informacoes_empresa',
    name: 'Declaração de Informações sobre a Empresa (Ato Constitutivo)',
    type: 'common',
  },
  {
    id: 'representacao_legal',
    name: 'Declaração de Representação Legal',
    type: 'common',
  },
  {
    id: 'informacoes_socios',
    name: 'Declaração de Informações sobre Sócios/Acionistas',
    type: 'common',
  },
  {
    id: 'informacoes_procuracao',
    name: 'Declaração de Informações sobre a Procuração',
    type: 'common',
  },

  // Declarações Específicas para Dispensas
  {
    id: 'formalizacao_demanda_dispensa',
    name: 'Documento de Formalização da Demanda (Dispensa)',
    type: 'specific_dispensation',
  },
  {
    id: 'justificativa_dispensa',
    name: 'Justificativa para a Dispensa de Licitação',
    type: 'specific_dispensation',
  },
  {
    id: 'justificativa_preco_dispensa',
    name: 'Justificativa do Preço (Dispensa de Licitação)',
    type: 'specific_dispensation',
  },
  {
    id: 'aprovacao_projeto_pesquisa_dispensa',
    name: 'Documento de Aprovação do Projeto (Dispensa para Pesquisa)',
    type: 'specific_dispensation',
  },
  {
    id: 'declaracao_mei_me_epp',
    name: 'Declaração de Enquadramento como MEI, ME ou EPP',
    type: 'specific_dispensation', // Can be common too
  },
];

// The getDeclarationText function is no longer needed as AI generates the text.
// If a fallback or simple placeholder is ever desired, it could be reinstated,
// but for now, the AI is responsible for the full text generation.
