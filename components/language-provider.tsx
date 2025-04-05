"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// 定义支持的语言
export const supportedLanguages = {
  en: {
    name: "English",
    translations: {
      // 通用
      appName: "Health Tracker",
      home: "Home",
      dashboard: "Dashboard",
      nutrition: "Nutrition",
      schedule: "My Weekly Schedule",
      more: "More",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
      login: "Login",
      register: "Register",
      retro: "Retro Gaming",
      switchTheme: "Switch Theme",

      // 设置页面
      appearance: "Appearance",
      notifications: "Notifications",
      preferences: "Preferences",
      account: "Account",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      saveChanges: "Save Changes",
      saving: "Saving...",

      // 健康相关
      health: "Health",
      exercise: "Exercise",
      workoutPlans: "Workout Plans",
      social: "Social",
      achievements: "Achievements",
      aiRecommendations: "AI Recommendations",

      // 其他
      emailNotifications: "Email Notifications",
      pushNotifications: "Push Notifications",
      weeklyReports: "Weekly Reports",
      measurementUnits: "Measurement Units",
      metric: "Metric (kg, cm)",
      imperial: "Imperial (lb, in)",
      language: "Language",
      dataSharing: "Data Sharing",
      dataSharingDesc: "Allow anonymous data sharing for research purposes",

      // 账户
      accountInfo: "Account Information",
      email: "Email",
      name: "Name",
      exportData: "Export Data",
      exportDataDesc: "Download all your health and exercise data",
      exporting: "Exporting...",
      dangerZone: "Danger Zone",
      deleteAccount: "Delete Account",
      deleteAccountDesc: "Permanently delete your account and all associated data",
      deleteConfirm: "Are you absolutely sure?",
      deleteConfirmDesc:
        "This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.",
      cancel: "Cancel",
      deleting: "Deleting...",
    },
  },
  es: {
    name: "Español",
    translations: {
      // General
      appName: "Seguimiento de Salud",
      home: "Inicio",
      dashboard: "Panel",
      nutrition: "Nutrición",
      schedule: "Mi Horario Semanal",
      more: "Más",
      profile: "Perfil",
      settings: "Configuración",
      logout: "Cerrar Sesión",
      login: "Iniciar Sesión",
      register: "Registrarse",
      retro: "Videojuegos Retro",
      switchTheme: "Cambiar Tema",

      // Settings page
      appearance: "Apariencia",
      notifications: "Notificaciones",
      preferences: "Preferencias",
      account: "Cuenta",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
      saveChanges: "Guardar Cambios",
      saving: "Guardando...",

      // Health related
      health: "Salud",
      exercise: "Ejercicio",
      workoutPlans: "Planes de Entrenamiento",
      social: "Social",
      achievements: "Logros",
      aiRecommendations: "Recomendaciones IA",

      // Others
      emailNotifications: "Notificaciones por Correo",
      pushNotifications: "Notificaciones Push",
      weeklyReports: "Informes Semanales",
      measurementUnits: "Unidades de Medida",
      metric: "Métrico (kg, cm)",
      imperial: "Imperial (lb, in)",
      language: "Idioma",
      dataSharing: "Compartir Datos",
      dataSharingDesc: "Permitir compartir datos anónimos para investigación",

      // Account
      accountInfo: "Información de la Cuenta",
      email: "Correo",
      name: "Nombre",
      exportData: "Exportar Datos",
      exportDataDesc: "Descargar todos tus datos de salud y ejercicio",
      exporting: "Exportando...",
      dangerZone: "Zona de Peligro",
      deleteAccount: "Eliminar Cuenta",
      deleteAccountDesc: "Eliminar permanentemente tu cuenta y todos los datos asociados",
      deleteConfirm: "¿Estás completamente seguro?",
      deleteConfirmDesc:
        "Esta acción no se puede deshacer. Eliminará permanentemente tu cuenta y todos tus datos de nuestros servidores.",
      cancel: "Cancelar",
      deleting: "Eliminando...",
    },
  },
  fr: {
    name: "Français",
    translations: {
      // Général
      appName: "Suivi de Santé",
      home: "Accueil",
      dashboard: "Tableau de Bord",
      nutrition: "Nutrition",
      schedule: "Mon Planning Hebdomadaire",
      more: "Plus",
      profile: "Profil",
      settings: "Paramètres",
      logout: "Déconnexion",
      login: "Connexion",
      register: "S'inscrire",
      retro: "Jeux Rétro",
      switchTheme: "Changer de Thème",

      // Page de paramètres
      appearance: "Apparence",
      notifications: "Notifications",
      preferences: "Préférences",
      account: "Compte",
      theme: "Thème",
      light: "Clair",
      dark: "Sombre",
      system: "Système",
      saveChanges: "Enregistrer",
      saving: "Enregistrement...",

      // Santé
      health: "Santé",
      exercise: "Exercice",
      workoutPlans: "Plans d'Entraînement",
      social: "Social",
      achievements: "Réalisations",
      aiRecommendations: "Recommandations IA",

      // Autres
      emailNotifications: "Notifications par Email",
      pushNotifications: "Notifications Push",
      weeklyReports: "Rapports Hebdomadaires",
      measurementUnits: "Unités de Mesure",
      metric: "Métrique (kg, cm)",
      imperial: "Impérial (lb, in)",
      language: "Langue",
      dataSharing: "Partage de Données",
      dataSharingDesc: "Autoriser le partage anonyme des données à des fins de recherche",

      // Compte
      accountInfo: "Informations du Compte",
      email: "Email",
      name: "Nom",
      exportData: "Exporter les Données",
      exportDataDesc: "Télécharger toutes vos données de santé et d'exercice",
      exporting: "Exportation...",
      dangerZone: "Zone Dangereuse",
      deleteAccount: "Supprimer le Compte",
      deleteAccountDesc: "Supprimer définitivement votre compte et toutes les données associées",
      deleteConfirm: "Êtes-vous absolument sûr ?",
      deleteConfirmDesc:
        "Cette action ne peut pas être annulée. Cela supprimera définitivement votre compte et toutes vos données de nos serveurs.",
      cancel: "Annuler",
      deleting: "Suppression...",
    },
  },
  zh: {
    name: "中文",
    translations: {
      // 通用
      appName: "健康追踪",
      home: "首页",
      dashboard: "仪表盘",
      nutrition: "营养",
      schedule: "我的每周计划",
      more: "更多",
      profile: "个人资料",
      settings: "设置",
      logout: "退出登录",
      login: "登录",
      register: "注册",
      retro: "复古游戏",
      switchTheme: "切换主题",

      // 设置页面
      appearance: "外观",
      notifications: "通知",
      preferences: "偏好设置",
      account: "账户",
      theme: "主题",
      light: "浅色",
      dark: "深色",
      system: "系统",
      saveChanges: "保存更改",
      saving: "保存中...",

      // 健康相关
      health: "健康",
      exercise: "运动",
      workoutPlans: "锻炼计划",
      social: "社交",
      achievements: "成就",
      aiRecommendations: "AI推荐",

      // 其他
      emailNotifications: "邮件通知",
      pushNotifications: "推送通知",
      weeklyReports: "每周报告",
      measurementUnits: "测量单位",
      metric: "公制 (kg, cm)",
      imperial: "英制 (lb, in)",
      language: "语言",
      dataSharing: "数据共享",
      dataSharingDesc: "允许匿名数据共享用于研究目的",

      // 账户
      accountInfo: "账户信息",
      email: "邮箱",
      name: "姓名",
      exportData: "导出数据",
      exportDataDesc: "下载您所有的健康和运动数据",
      exporting: "导出中...",
      dangerZone: "危险区域",
      deleteAccount: "删除账户",
      deleteAccountDesc: "永久删除您的账户和所有相关数据",
      deleteConfirm: "您确定要这样做吗？",
      deleteConfirmDesc: "此操作无法撤销。这将永久删除您的账户并从我们的服务器中删除所有数据。",
      cancel: "取消",
      deleting: "删除中...",
    },
  },
}

type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("en")

  // 从本地存储或用户设置中加载语言设置
  useEffect(() => {
    const fetchLanguageSetting = async () => {
      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          if (data.language && supportedLanguages[data.language as keyof typeof supportedLanguages]) {
            setLanguage(data.language)
          }
        }
      } catch (error) {
        console.error("Error fetching language setting:", error)
      }
    }

    // 尝试从localStorage获取语言设置
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage && supportedLanguages[savedLanguage as keyof typeof supportedLanguages]) {
      setLanguage(savedLanguage)
    } else {
      // 如果没有本地存储的语言设置，尝试从用户设置获取
      fetchLanguageSetting()
    }
  }, [])

  // 当语言改变时保存到本地存储
  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  // 翻译函数
  const t = (key: string): string => {
    const translations = supportedLanguages[language as keyof typeof supportedLanguages]?.translations
    return translations && translations[key as keyof typeof translations]
      ? translations[key as keyof typeof translations]
      : supportedLanguages.en.translations[key as keyof typeof supportedLanguages.en.translations] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

