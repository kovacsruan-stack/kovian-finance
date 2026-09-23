import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  'pt-BR': { common: {
    language: 'Português', financeName:'Finance', fitness:'Fitness', koviAi:'KOVI AI', closeMenu:'Fechar menu', search:'Buscar', searchFinance:'Buscar no KOVIAN Finance...', noResults:'Nenhum resultado encontrado.', escToClose:'Esc para fechar', financeLoadError:'Não foi possível carregar os dados financeiros.', loginToLoadFinance:'Faça login para carregar seus dados financeiros.', newTransaction:'Nova transação', consolidatedBalance:'Saldo consolidado BRL', loading:'Carregando...', syncedAccounts:'{{count}} conta(s) sincronizada(s)', income90:'Receitas · 90 dias', expense90:'Despesas · 90 dias', activeGoals:'Metas ativas', connectedAccounts:'Contas conectadas', viewAll:'Ver todas', noAccounts:'Nenhuma conta cadastrada.', quickAccess:'ACESSO RÁPIDO', organize:'Organizar', manageBalances:'Gerencie saldos.', trackInOut:'Acompanhe entradas e saídas.', trackGoals:'Acompanhe objetivos.', analyzePeriods:'Analise períodos.', overview: 'Visão geral', chat: 'Conversar com KOVI', projects: 'Projetos',
    development: 'Desenvolvimento', research: 'Pesquisa', automations: 'Automações', integrations: 'Integrações', settings: 'Configurações',
    principal: 'Principal', work: 'Trabalho', system: 'Sistema', online: 'Online', newProject: 'Novo projeto',
    dashboardTitle: 'Seu centro de comando inteligente.', dashboardDesc: 'Orquestre projetos, agentes e automações sem começar por configurações técnicas.',
    status: 'Status do KOVI', ready: 'Operação pronta para continuar', chatTitle: 'Conversar com KOVI',
    financeOverview: 'Visão geral', accounts: 'Contas', transactions: 'Transações', goals: 'Metas e orçamento',
    reports: 'Relatórios', subscriptions: 'Assinaturas', cards: 'Cartões', budgets: 'Orçamentos', recurring: 'Recorrentes', categories: 'Categorias', financeIntegrations: 'Integrações', financeSettings: 'Configurações', more: 'Mais', group_principal: 'Principal', group_planejamento: 'Planejamento', group_organizacao: 'Organização', group_sistema: 'Sistema'
  }},
  en: { common: {
    language: 'English', financeName:'Finance', fitness:'Fitness', koviAi:'KOVI AI', closeMenu:'Close menu', search:'Search', searchFinance:'Search KOVIAN Finance...', noResults:'No results found.', escToClose:'Esc to close', financeLoadError:'Unable to load financial data.', loginToLoadFinance:'Sign in to load your financial data.', newTransaction:'New transaction', consolidatedBalance:'Consolidated BRL balance', loading:'Loading...', syncedAccounts:'{{count}} account(s) synchronized', income90:'Income · 90 days', expense90:'Expenses · 90 days', activeGoals:'Active goals', connectedAccounts:'Connected accounts', viewAll:'View all', noAccounts:'No accounts registered.', quickAccess:'QUICK ACCESS', organize:'Organize', manageBalances:'Manage balances.', trackInOut:'Track income and expenses.', trackGoals:'Track goals.', analyzePeriods:'Analyze periods.', overview: 'Overview', chat: 'Chat with KOVI', projects: 'Projects',
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