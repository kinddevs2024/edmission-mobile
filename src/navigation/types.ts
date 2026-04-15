import type { NavigatorScreenParams } from '@react-navigation/native'

export type AuthStackParamList = {
  Landing: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  VerifyEmail: { email?: string } | undefined
  ResetPassword: { token?: string } | undefined
  ChooseLanguage: { next?: string } | undefined
  YandexCallback: undefined
  Privacy: undefined
  Cookies: undefined
}

/** @deprecated Native student tabs replaced by embedded SPA (`StudentWebAppScreen`). Kept for typing legacy screens. */
export type StudentTabParamList = {
  StudentDashboard: undefined
  StudentApplications: undefined
  ExploreUniversities: undefined
  StudentChat: undefined
  StudentProfilePage: undefined
}

export type StudentStackParamList = {
  /** Full student shell: loads `edmission-front` (same UI as mobile web). Use `path` for deep links, e.g. `/student/chat`. */
  StudentHome: { path?: string } | undefined
  StudentMore: undefined
  StudentAI: { initialPrompt?: string } | undefined
  Notifications: undefined
  ProfileGlobal: undefined
  Search: { q?: string } | undefined
  AIChat: undefined
  Payment: undefined
  PaymentSuccess: undefined
  PaymentCancel: undefined
  Support: { id?: string } | undefined
  Privacy: undefined
  Cookies: undefined
}

/** Pre-verification flow (no university profile or pending approval) */
export type UniversityGateStackParamList = {
  UniversitySelect: undefined
  UniversityPendingVerification: undefined
}

/** Bottom tabs for verified university users */
export type UniversityTabParamList = {
  UniversityDashboard: undefined
  UniversityDiscovery: undefined
  UniversityPipeline: undefined
  UniversityProfilePage: undefined
  UniversityChat: undefined
}

export type UniversityStackParamList = {
  UniversityHome: NavigatorScreenParams<UniversityTabParamList> | undefined
  UniversitySelect: undefined
  UniversityPendingVerification: undefined
  UniversityOnboarding: undefined
  UniversityStudentProfile: { studentId: string }
  UniversityDocuments: undefined
  UniversityFlyers: undefined
  UniversityFlyerEditorNew: undefined
  DocumentTemplateEditorNew: undefined
  DocumentTemplateEditor: { id: string }
  OfferTemplates: undefined
  Scholarships: undefined
  Faculties: undefined
  UniversityAnalytics: undefined
  UniversityAI: undefined
  Notifications: undefined
  ProfileGlobal: undefined
  Search: { q?: string } | undefined
  Support: { id?: string } | undefined
  Payment: undefined
  PaymentSuccess: undefined
  PaymentCancel: undefined
  Privacy: undefined
  Cookies: undefined
}

/** Bottom tabs for school counsellor */
export type SchoolTabParamList = {
  SchoolDashboard: undefined
  CounsellorStudents: undefined
  CounsellorStudentInterests: { preselectStudentUserId?: string } | undefined
  CounsellorJoinRequests: undefined
  CounsellorSchoolProfile: undefined
}

export type SchoolStackParamList = {
  SchoolHome: NavigatorScreenParams<SchoolTabParamList> | undefined
  CounsellorStudentProfile: { studentId: string }
  Notifications: undefined
  ProfileGlobal: undefined
  Search: { q?: string } | undefined
  Support: { id?: string } | undefined
  Payment: undefined
  PaymentSuccess: undefined
  PaymentCancel: undefined
  Privacy: undefined
  Cookies: undefined
}

/** Bottom tabs — admin (mobile, simplified) */
export type AdminTabParamList = {
  AdminDashboard: undefined
  AdminUsers: undefined
  AdminVerification: undefined
  AdminUniversityRequests: undefined
  AdminMore: undefined
}

export type AdminStackParamList = {
  AdminHome: NavigatorScreenParams<AdminTabParamList> | undefined
  AdminChats: undefined
  AdminChatDetail: { chatId: string }
  AdminTickets: undefined
  AdminTicketDetail: { ticketId: string }
  AdminHealth: undefined
  Notifications: undefined
  ProfileGlobal: undefined
  Support: { id?: string } | undefined
  Payment: undefined
  PaymentSuccess: undefined
  PaymentCancel: undefined
  Privacy: undefined
  Cookies: undefined
}
