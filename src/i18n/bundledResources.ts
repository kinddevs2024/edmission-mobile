import enCommon from '@/locales/en/common.json'
import enAuth from '@/locales/en/auth.json'
import enLanding from '@/locales/en/landing.json'
import enCookies from '@/locales/en/cookies.json'
import enStudent from '@/locales/en/student.json'
import enUniversity from '@/locales/en/university.json'
import enAdmin from '@/locales/en/admin.json'
import enSchool from '@/locales/en/school.json'
import enDocuments from '@/locales/en/documents.json'
import enErrors from '@/locales/en/errors.json'
import enChat from '@/locales/en/chat.json'

import ruCommon from '@/locales/ru/common.json'
import ruAuth from '@/locales/ru/auth.json'
import ruLanding from '@/locales/ru/landing.json'
import ruCookies from '@/locales/ru/cookies.json'
import ruStudent from '@/locales/ru/student.json'
import ruUniversity from '@/locales/ru/university.json'
import ruAdmin from '@/locales/ru/admin.json'
import ruSchool from '@/locales/ru/school.json'
import ruDocuments from '@/locales/ru/documents.json'
import ruErrors from '@/locales/ru/errors.json'
import ruChat from '@/locales/ru/chat.json'

import uzCommon from '@/locales/uz/common.json'
import uzAuth from '@/locales/uz/auth.json'
import uzLanding from '@/locales/uz/landing.json'
import uzCookies from '@/locales/uz/cookies.json'
import uzStudent from '@/locales/uz/student.json'
import uzUniversity from '@/locales/uz/university.json'
import uzAdmin from '@/locales/uz/admin.json'
import uzSchool from '@/locales/uz/school.json'
import uzDocuments from '@/locales/uz/documents.json'
import uzErrors from '@/locales/uz/errors.json'
import uzChat from '@/locales/uz/chat.json'

const en = {
  common: enCommon,
  auth: enAuth,
  landing: enLanding,
  cookies: enCookies,
  student: enStudent,
  university: enUniversity,
  admin: enAdmin,
  school: enSchool,
  documents: enDocuments,
  errors: enErrors,
  chat: enChat,
}

const ru = {
  common: ruCommon,
  auth: ruAuth,
  landing: ruLanding,
  cookies: ruCookies,
  student: ruStudent,
  university: ruUniversity,
  admin: ruAdmin,
  school: ruSchool,
  documents: ruDocuments,
  errors: ruErrors,
  chat: ruChat,
}

const uz = {
  common: uzCommon,
  auth: uzAuth,
  landing: uzLanding,
  cookies: uzCookies,
  student: uzStudent,
  university: uzUniversity,
  admin: uzAdmin,
  school: uzSchool,
  documents: uzDocuments,
  errors: uzErrors,
  chat: uzChat,
}

export const bundledResources = {
  en,
  ru,
  uz,
} as const
