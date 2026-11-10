import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type SupportedLanguage = 'en' | 'fr' | 'es' | 'tw'

export interface LanguageInfo {
  code: SupportedLanguage
  name: string
  short: string
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'fr', name: 'Français', short: 'FR' },
  { code: 'es', name: 'Español', short: 'ES' },
  { code: 'tw', name: 'Twi', short: 'TW' },
]

export const translations = {
  en: {
    // Topbar & shell
    workspace: 'Workspace',
    viewWebsite: 'View website',
    openNav: 'Open navigation',
    closeNav: 'Close navigation',
    workspaceSettings: 'Workspace settings',
    impactWorkspace: 'THE IMPACT WORKSPACE',
    adminRole: 'Arc Administrator',
    adminSubrole: 'Workspace admin',
    skipToContent: 'Skip to content',

    // Nav sections
    navSectionWorkspace: 'WORKSPACE',
    navSectionCommunity: 'OUR COMMUNITY',
    navSectionAdmin: 'ADMINISTRATION',

    // Nav items
    overview: 'Overview',
    analytics: 'Analytics',
    outreaches: 'Outreaches',
    programs: 'Programs',
    news: 'News & stories',
    team: 'Team',
    partners: 'Partners',
    volunteers: 'Volunteers',
    donations: 'Donations',
    messages: 'Messages',
    subscribers: 'Subscribers',
    reports: 'Reports',
    admins: 'Administrators',
    auditLogs: 'Audit logs',
    settings: 'Settings',

    // Greetings & overview hero
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    welcomeBack: 'Welcome back',
    overviewSub: 'Your outreach, volunteers and impact at a glance.',
    syncLiveData: 'Sync live data',
    syncing: 'Syncing…',
    newOutreach: 'New outreach',
    manageOutreaches: 'Manage outreaches',
    liveDataActive: 'Live data active',
    updated: 'Updated',
    connectionInterrupted: 'Connection interrupted',
    connecting: 'Connecting to your workspace…',

    // Impact / Stats
    peopleScreened: 'People screened',
    peopleReached: 'people reached',
    chartPeriod: 'Chart period',
    last3Months: 'Last 3 months',
    last6Months: 'Last 6 months',
    last12Months: 'Last 12 months',
    upcomingOutreaches: 'upcoming outreach',
    upcomingOutreachesPlural: 'upcoming outreaches',
    volunteerApplications: 'volunteer application',
    volunteerApplicationsPlural: 'volunteer applications',
    toReview: 'to review.',
    youHave: 'You have',
    and: 'and',

    // Table / Controls
    search: 'Search',
    filterByStatus: 'Filter by status',
    allStatuses: 'All statuses',
    status: 'Status',
    date: 'Date',
    community: 'COMMUNITY',
    program: 'OUTREACH / PROGRAM',
    add: 'Add',
    edit: 'Edit',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    saveDraft: 'Save draft',
    savePublish: 'Save & publish',
    tryAgain: 'Try again',
    noRecords: 'No outreaches match this view.',
    signOut: 'Sign out',
    exportReport: 'Export report',

    // Statuses
    planning: 'Planning',
    confirmed: 'Confirmed',
    completed: 'Completed',
    pending: 'Pending',
    active: 'Active',
    received: 'Received',
    pledged: 'Pledged',
    declined: 'Declined',

    // Extra overview keys
    activeVolunteers: 'Active volunteers',
    donationsReceived: 'Donations received',
    plannedOutreaches: 'Planned outreaches',
    needsAttention: 'Needs attention',
    pledgedDonations: 'Pledged donations',
    viewAll: 'View all',
    completedVisits: 'completed screening visits',
    aimToReach: 'people we aim to reach',

    // Language
    language: 'Language',
    languageChanged: 'Language set to English',
  },
  fr: {
    // Topbar & shell
    workspace: 'Espace de travail',
    viewWebsite: 'Voir le site web',
    openNav: 'Ouvrir la navigation',
    closeNav: 'Fermer la navigation',
    workspaceSettings: "Paramètres de l'espace",
    impactWorkspace: "ESPACE D'IMPACT",
    adminRole: 'Administrateur Arc',
    adminSubrole: "Admin de l'espace",
    skipToContent: 'Aller au contenu',

    // Nav sections
    navSectionWorkspace: 'ESPACE DE TRAVAIL',
    navSectionCommunity: 'NOTRE COMMUNAUTÉ',
    navSectionAdmin: 'ADMINISTRATION',

    // Nav items
    overview: 'Aperçu',
    analytics: 'Statistiques',
    outreaches: 'Sensibilisations',
    programs: 'Programmes',
    news: 'Actualités & récits',
    team: 'Équipe',
    partners: 'Partenaires',
    volunteers: 'Bénévoles',
    donations: 'Dons',
    messages: 'Messages',
    subscribers: 'Abonnés',
    reports: 'Rapports',
    admins: 'Administrateurs',
    auditLogs: "Journaux d'audit",
    settings: 'Paramètres',

    // Greetings & overview hero
    goodMorning: 'Bonjour',
    goodAfternoon: 'Bon après-midi',
    goodEvening: 'Bonsoir',
    welcomeBack: 'Bienvenue',
    overviewSub: 'Vos sensibilisations, bénévoles et impact en un coup d’œil.',
    syncLiveData: 'Synchroniser les données',
    syncing: 'Synchronisation…',
    newOutreach: 'Nouvelle sensibilisation',
    manageOutreaches: 'Gérer les sensibilisations',
    liveDataActive: 'Données en direct actives',
    updated: 'Mis à jour',
    connectionInterrupted: 'Connexion interrompue',
    connecting: 'Connexion à votre espace…',

    // Impact / Stats
    peopleScreened: 'Personnes dépistées',
    peopleReached: 'personnes touchées',
    chartPeriod: 'Période du graphique',
    last3Months: '3 derniers mois',
    last6Months: '6 derniers mois',
    last12Months: '12 derniers mois',
    upcomingOutreaches: 'sensibilisation à venir',
    upcomingOutreachesPlural: 'sensibilisations à venir',
    volunteerApplications: 'candidature de bénévole',
    volunteerApplicationsPlural: 'candidatures de bénévoles',
    toReview: 'à examiner.',
    youHave: 'Vous avez',
    and: 'et',

    // Table / Controls
    search: 'Rechercher',
    filterByStatus: 'Filtrer par statut',
    allStatuses: 'Tous les statuts',
    status: 'Statut',
    date: 'Date',
    community: 'COMMUNAUTÉ',
    program: 'SENSIBILISATION / PROGRAMME',
    add: 'Ajouter',
    edit: 'Modifier',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    saveDraft: 'Enregistrer le brouillon',
    savePublish: 'Enregistrer & publier',
    tryAgain: 'Réessayer',
    noRecords: 'Aucune sensibilisation ne correspond à cette vue.',
    signOut: 'Se déconnecter',
    exportReport: 'Exporter le rapport',

    // Statuses
    planning: 'Planification',
    confirmed: 'Confirmé',
    completed: 'Terminé',
    pending: 'En attente',
    active: 'Actif',
    received: 'Reçu',
    pledged: 'Promis',
    declined: 'Refusé',

    // Extra overview keys
    activeVolunteers: 'Bénévoles actifs',
    donationsReceived: 'Dons reçus',
    plannedOutreaches: 'Sensibilisations prévues',
    needsAttention: 'Attention requise',
    pledgedDonations: 'Promesses de dons',
    viewAll: 'Voir tout',
    completedVisits: 'visites de dépistage terminées',
    aimToReach: 'personnes que nous visons à atteindre',

    // Language
    language: 'Langue',
    languageChanged: 'Langue définie sur Français',
  },
  es: {
    // Topbar & shell
    workspace: 'Espacio de trabajo',
    viewWebsite: 'Ver sitio web',
    openNav: 'Abrir navegación',
    closeNav: 'Cerrar navegación',
    workspaceSettings: 'Configuración del espacio',
    impactWorkspace: 'ESPACIO DE IMPACTO',
    adminRole: 'Administrador de Arc',
    adminSubrole: 'Admin del espacio',
    skipToContent: 'Saltar al contenido',

    // Nav sections
    navSectionWorkspace: 'ESPACIO DE TRABAJO',
    navSectionCommunity: 'NUESTRA COMUNIDAD',
    navSectionAdmin: 'ADMINISTRACIÓN',

    // Nav items
    overview: 'Resumen',
    analytics: 'Analíticas',
    outreaches: 'Alcances',
    programs: 'Programas',
    news: 'Noticias e historias',
    team: 'Equipo',
    partners: 'Socios',
    volunteers: 'Voluntarios',
    donations: 'Donaciones',
    messages: 'Mensajes',
    subscribers: 'Suscriptores',
    reports: 'Informes',
    admins: 'Administradores',
    auditLogs: 'Registros de auditoría',
    settings: 'Configuración',

    // Greetings & overview hero
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    welcomeBack: 'Bienvenido',
    overviewSub: 'Sus alcances, voluntarios e impacto de un vistazo.',
    syncLiveData: 'Sincronizar datos',
    syncing: 'Sincronizando…',
    newOutreach: 'Nuevo alcance',
    manageOutreaches: 'Gestionar alcances',
    liveDataActive: 'Datos en vivo activos',
    updated: 'Actualizado',
    connectionInterrupted: 'Conexión interrumpida',
    connecting: 'Conectando con su espacio…',

    // Impact / Stats
    peopleScreened: 'Personas examinadas',
    peopleReached: 'personas alcanzadas',
    chartPeriod: 'Período del gráfico',
    last3Months: 'Últimos 3 meses',
    last6Months: 'Últimos 6 meses',
    last12Months: 'Últimos 12 meses',
    upcomingOutreaches: 'alcance próximo',
    upcomingOutreachesPlural: 'alcances próximos',
    volunteerApplications: 'solicitud de voluntario',
    volunteerApplicationsPlural: 'solicitudes de voluntarios',
    toReview: 'por revisar.',
    youHave: 'Tiene',
    and: 'y',

    // Table / Controls
    search: 'Buscar',
    filterByStatus: 'Filtrar por estado',
    allStatuses: 'Todos los estados',
    status: 'Estado',
    date: 'Fecha',
    community: 'COMUNIDAD',
    program: 'ALCANCE / PROGRAMA',
    add: 'Añadir',
    edit: 'Editar',
    save: 'Guardar',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    saveDraft: 'Guardar borrador',
    savePublish: 'Guardar y publicar',
    tryAgain: 'Reintentar',
    noRecords: 'Ningún alcance coincide con esta vista.',
    signOut: 'Cerrar sesión',
    exportReport: 'Exportar informe',

    // Statuses
    planning: 'Planificación',
    confirmed: 'Confirmado',
    completed: 'Completado',
    pending: 'Pendiente',
    active: 'Activo',
    received: 'Recibido',
    pledged: 'Comprometido',
    declined: 'Rechazado',

    // Extra overview keys
    activeVolunteers: 'Voluntarios activos',
    donationsReceived: 'Donaciones recibidas',
    plannedOutreaches: 'Alcances planeados',
    needsAttention: 'Requiere atención',
    pledgedDonations: 'Donaciones comprometidas',
    viewAll: 'Ver todo',
    completedVisits: 'visitas de evaluación completadas',
    aimToReach: 'personas que buscamos alcanzar',

    // Language
    language: 'Idioma',
    languageChanged: 'Idioma cambiado a Español',
  },
  tw: {
    // Topbar & shell
    workspace: 'Adwuma bea',
    viewWebsite: 'Kɔ wɛbsaet so',
    openNav: 'Bue akwankyerɛ',
    closeNav: 'To akwankyerɛ mu',
    workspaceSettings: 'Adwuma bea nsiesie',
    impactWorkspace: 'NKƆSOƆ ADWUMA BEA',
    adminRole: 'Arc Panyin',
    adminSubrole: 'Adwuma sohwɛfoɔ',
    skipToContent: 'Kɔ asɛm no so tee',

    // Nav sections
    navSectionWorkspace: 'ADWUMA BEA',
    navSectionCommunity: 'YƐN MPƆTAM',
    navSectionAdmin: 'ADWUMAYƐ',

    // Nav items
    overview: 'Nhwɛsoɔ',
    analytics: 'Akontabuo',
    outreaches: 'Nsrahwɛ',
    programs: 'Nhyehyɛeɛ',
    news: 'Nsɛm & Abasɛm',
    team: 'Ekuo',
    partners: 'Ahokafoɔ',
    volunteers: 'Ahofamafoɔ',
    donations: 'Nkyɛdeɛ',
    messages: 'Nkratoɔ',
    subscribers: 'Akyidifoɔ',
    reports: 'Amanneɛbɔ',
    admins: 'Ahwɛfoɔ',
    auditLogs: 'Nhwehwɛmu',
    settings: 'Nsiesie',

    // Greetings & overview hero
    goodMorning: 'Maakye',
    goodAfternoon: 'Maaha',
    goodEvening: 'Maadwo',
    welcomeBack: 'Akwaaba bio',
    overviewSub: 'Wo nsrahwɛ, ahofamafoɔ ne nkɔsoɔ wɔ baabi baako.',
    syncLiveData: 'Fa data foforo bra',
    syncing: 'Ɛretwetwe…',
    newOutreach: 'Nsrahwɛ foforɔ',
    manageOutreaches: 'Hwɛ nsrahwɛ so',
    liveDataActive: 'Data foforo redi dwuma',
    updated: 'Yɛasiesie no',
    connectionInterrupted: 'Kwan no atu',
    connecting: 'Ɛrekɔ adwuma bea…',

    // Impact / Stats
    peopleScreened: 'Nnipa a yɛahwɛ wɔn ani',
    peopleReached: 'nnipa a yɛadu wɔn nkyɛn',
    chartPeriod: 'Bere nhyehyɛeɛ',
    last3Months: 'Abosome 3 a atwam',
    last6Months: 'Abosome 6 a atwam',
    last12Months: 'Abosome 12 a atwam',
    upcomingOutreaches: 'nsrahwɛ a ɛreba',
    upcomingOutreachesPlural: 'nsrahwɛ a ɛreba',
    volunteerApplications: 'ahofamfoɔ abisadeɛ',
    volunteerApplicationsPlural: 'ahofamfoɔ abisadeɛ',
    toReview: 'a ɛsɛ sɛ yɛhwɛ mu.',
    youHave: 'Wowɔ',
    and: 'ne',

    // Table / Controls
    search: 'Hwehwɛ',
    filterByStatus: 'Yi gyinabea',
    allStatuses: 'Gyinabea nyinaa',
    status: 'Gyinabea',
    date: 'Da',
    community: 'MPƆTAM',
    program: 'NSRAHWƐ / NHYEHYƐEƐ',
    add: 'Fa ka ho',
    edit: 'Siesie',
    save: 'Sie',
    saving: 'Ɛresie…',
    cancel: 'Gyae',
    saveDraft: 'Sie sɛ draft',
    savePublish: 'Sie na fa to dwa',
    tryAgain: 'Sɔ hwɛ bio',
    noRecords: 'Nsrahwɛ biara nni ha a ɛne eyi hyia.',
    signOut: 'Pue',
    exportReport: 'Yi amanneɛbɔ',

    // Statuses
    planning: 'Nhyehyɛeɛ',
    confirmed: 'Yɛagye atom',
    completed: 'Awie',
    pending: 'Ɛretwɛn',
    active: 'Ɛreyɛ adwuma',
    received: 'Yɛanya',
    pledged: 'Wɔahyɛ bɔ',
    declined: 'Yɛanpene',

    // Extra overview keys
    activeVolunteers: 'Ahofamafoɔ a wɔreyɛ adwuma',
    donationsReceived: 'Nkyɛdeɛ a yɛanya',
    plannedOutreaches: 'Nsrahwɛ a yɛayɛ ho nhyehyɛeɛ',
    needsAttention: 'Hia w’adwene',
    pledgedDonations: 'Nkyɛdeɛ a wɔahyɛ ho bɔ',
    viewAll: 'Hwɛ ne nyinaa',
    completedVisits: 'nsrahwɛ a yɛawie',
    aimToReach: 'nnipa a yɛpɛ sɛ yɛdu wɔn nkyɛn',

    // Language
    language: 'Kasa',
    languageChanged: 'Yɛasesa kasa no akɔ Twi so',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export interface I18nContextType {
  lang: SupportedLanguage
  setLang: (lang: SupportedLanguage) => void
  t: (key: TranslationKey, fallback?: string) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
}

const defaultI18n: I18nContextType = {
  lang: 'en',
  setLang: () => {},
  t: (key: TranslationKey, fallback?: string) => translations.en[key] || fallback || key,
  formatDate: (date: Date) => date.toLocaleDateString('en-GB'),
}

export const I18nContext = createContext<I18nContextType>(defaultI18n)

const LOCALE_TAGS: Record<SupportedLanguage, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  es: 'es-ES',
  tw: 'en-GB',
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('arc_admin_lang') as SupportedLanguage
      if (saved && ['en', 'fr', 'es', 'tw'].includes(saved)) return saved
    } catch {
      // ignore
    }
    return 'en'
  })

  const setLang = (next: SupportedLanguage) => {
    setLangState(next)
    try {
      localStorage.setItem('arc_admin_lang', next)
      document.documentElement.lang = next
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    try {
      document.documentElement.lang = lang
    } catch {
      // ignore
    }
  }, [lang])

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = translations[lang] as Record<string, string>
    if (langDict && langDict[key]) return langDict[key]
    const enDict = translations.en as Record<string, string>
    return enDict[key] || fallback || key
  }

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    const locale = LOCALE_TAGS[lang] || 'en-GB'
    return date.toLocaleDateString(locale, { timeZone: 'Africa/Accra', ...options })
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, formatDate }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
