import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  'pt-BR': { common: {
    language: 'Português', overview: 'Visão geral', chat: 'Conversar com KOVI', projects: 'Projetos',
    development: 'Desenvolvimento', research: 'Pesquisa', automations: 'Automações', integrations: 'Integrações', settings: 'Configurações',
    principal: 'Principal', work: 'Trabalho', system: 'Sistema', online: 'Online', newProject: 'Novo projeto',
    dashboardTitle: 'Seu centro de comando inteligente.', dashboardDesc: 'Orquestre projetos, agentes e automações sem começar por configurações técnicas.',
    status: 'Status do KOVI', ready: 'Operação pronta para continuar', chatTitle: 'Conversar com KOVI',
    financeOverview: 'Visão geral', accounts: 'Contas', transactions: 'Transações', goals: 'Metas e orçamento',
    reports: 'Relatórios', subscriptions: 'Assinaturas', cards: 'Cartões', budgets: 'Orçamentos', recurring: 'Recorrentes', categories: 'Categorias', financeIntegrations: 'Integrações', financeSettings: 'Configurações', more: 'Mais', group_principal: 'Principal', group_planejamento: 'Planejamento', group_organizacao: 'Organização', group_sistema: 'Sistema'
  }},
  en: { common: {
    language: 'English', overview: 'Overview', chat: 'Chat with KOVI', projects: 'Projects',
    development: 'Development', research: 'Research', automations: 'Automations', integrations: 'Integrations', settings: 'Settings',
    principal: 'Main', work: 'Work', system: 'System', online: 'Online', newProject: 'New project',
    dashboardTitle: 'Your intelligent command center.', dashboardDesc: 'Orchestrate projects, agents and automations without starting with technical configuration.',
    status: 'KOVI status', ready: 'Operation ready to continue', chatTitle: 'Chat with KOVI',
    financeOverview: 'Overview', accounts: 'Accounts', transactions: 'Transactions', goals: 'Goals & budget',
    reports: 'Reports', subscriptions: 'Subscriptions', cards: 'Cards', budgets: 'Budgets', recurring: 'Recurring', categories: 'Categories', financeIntegrations: 'Integrations', financeSettings: 'Settings', more: 'More', group_principal: 'Main', group_planejamento: 'Planning', group_organizacao: 'Organization', group_sistema: 'System'
  }},
}
void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources, fallbackLng: 'pt-BR', supportedLngs: ['pt-BR', 'en'], load: 'currentOnly',
  defaultNS: 'common', ns: ['common'],
  detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'kovian-language' },
  interpolation: { escapeValue: false }, react: { useSuspense: false },
})
export default i18n