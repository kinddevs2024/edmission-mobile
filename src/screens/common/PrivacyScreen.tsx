import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { fontSize, fontWeight, radii, space, useThemeColors } from '@/theme'

type PrivacySection = {
  title: string
  body: string
}

type PrivacyCopy = {
  title: string
  lastUpdated: string
  sections: PrivacySection[]
}

const PRIVACY_COPY: Record<'en' | 'ru' | 'uz', PrivacyCopy> = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: February 2025',
    sections: [
      {
        title: '1. Information we collect',
        body:
          'We collect information you provide when registering (email, name, role), when completing your profile (education, documents, preferences), and when you use the platform (applications, messages, usage data). We may also collect device and log data for security and analytics.',
      },
      {
        title: '2. How we use your information',
        body:
          'We use your information to operate the platform, match students with universities, send notifications you have agreed to (e.g. application status, trial reminders), process payments, verify documents, and improve our services. We do not sell your personal data to third parties.',
      },
      {
        title: '3. Data sharing',
        body:
          'Profile and application data may be shared with universities you apply to. We use trusted service providers (e.g. hosting, email, payment processing) under strict agreements. We may disclose data when required by law or to protect our rights and safety.',
      },
      {
        title: '4. Security and retention',
        body:
          'We use industry-standard measures to protect your data. We retain your data for as long as your account is active or as needed to provide services and comply with legal obligations. You can request deletion of your account and associated data via support.',
      },
      {
        title: '5. Your rights',
        body:
          'You can access and update your profile and notification preferences in your account. You may request a copy of your data, correction, or deletion. In some regions you have additional rights (e.g. object to processing, data portability). Contact us at support for any request.',
      },
      {
        title: '6. Contact',
        body:
          'For privacy-related questions or requests, contact us through the Support section or at the contact details provided on the platform.',
      },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    lastUpdated: 'Последнее обновление: февраль 2025',
    sections: [
      {
        title: '1. Какие данные мы собираем',
        body:
          'Мы собираем информацию, которую вы предоставляете при регистрации (email, имя, роль), при заполнении профиля (образование, документы, предпочтения), а также данные об использовании платформы (заявки, сообщения, активность). Для безопасности и аналитики также могут собираться данные устройства и журналов.',
      },
      {
        title: '2. Как мы используем информацию',
        body:
          'Мы используем ваши данные для работы платформы, подбора студентов и университетов, отправки согласованных уведомлений (например, о статусе заявки и напоминаниях), обработки платежей, проверки документов и улучшения сервиса. Мы не продаем персональные данные третьим лицам.',
      },
      {
        title: '3. Передача данных',
        body:
          'Данные профиля и заявок могут передаваться университетам, в которые вы подаете заявку. Мы используем надежных сервис-провайдеров (хостинг, email, платежи) по строгим соглашениям. Данные также могут быть раскрыты, если этого требует закон, либо для защиты наших прав и безопасности.',
      },
      {
        title: '4. Безопасность и хранение',
        body:
          'Мы применяем стандартные отраслевые меры защиты данных. Мы храним данные, пока ваш аккаунт активен, а также столько, сколько необходимо для оказания услуг и соблюдения законодательства. Вы можете запросить удаление аккаунта и связанных данных через поддержку.',
      },
      {
        title: '5. Ваши права',
        body:
          'Вы можете просматривать и обновлять данные профиля и настройки уведомлений в аккаунте. Вы можете запросить копию данных, исправление или удаление. В некоторых регионах у вас могут быть дополнительные права (например, возражение против обработки, переносимость данных). По любым запросам обращайтесь в поддержку.',
      },
      {
        title: '6. Контакты',
        body:
          'По вопросам конфиденциальности и запросам, связанным с персональными данными, свяжитесь с нами через раздел Support или по контактам, указанным на платформе.',
      },
    ],
  },
  uz: {
    title: 'Maxfiylik siyosati',
    lastUpdated: 'Oxirgi yangilanish: 2025-yil fevral',
    sections: [
      {
        title: '1. Biz qanday maʼlumotlarni yigʻamiz',
        body:
          'Roʻyxatdan oʻtishda bergan maʼlumotlaringizni (email, ism, rol), profilni toʻldirishda kiritgan maʼlumotlaringizni (taʼlim, hujjatlar, afzalliklar) va platformadan foydalanish jarayonidagi maʼlumotlarni (arizalar, xabarlar, faollik) yigʻamiz. Xavfsizlik va analitika uchun qurilma hamda log maʼlumotlari ham yigʻilishi mumkin.',
      },
      {
        title: '2. Maʼlumotlardan qanday foydalanamiz',
        body:
          'Maʼlumotlaringizdan platformani ishlatish, talaba va universitetlarni moslashtirish, siz rozilik bergan bildirishnomalarni yuborish (masalan, ariza holati, eslatmalar), toʻlovlarni qayta ishlash, hujjatlarni tekshirish va xizmatni yaxshilash uchun foydalanamiz. Shaxsiy maʼlumotlaringizni uchinchi tomonga sotmaymiz.',
      },
      {
        title: '3. Maʼlumotlarni ulashish',
        body:
          'Profil va ariza maʼlumotlari siz ariza topshirgan universitetlar bilan ulashilishi mumkin. Biz ishonchli xizmat ko‘rsatuvchilar (xosting, email, toʻlov tizimlari) bilan qatʼiy kelishuvlar asosida ishlaymiz. Qonun talab qilganda yoki huquqlarimiz va xavfsizlikni himoya qilish uchun maʼlumotlar oshkor qilinishi mumkin.',
      },
      {
        title: '4. Xavfsizlik va saqlash muddati',
        body:
          'Maʼlumotlarni himoya qilish uchun sohada qabul qilingan standart choralarni qoʻllaymiz. Maʼlumotlar akkauntingiz faol bo‘lgan davrda, shuningdek xizmat ko‘rsatish va qonuniy talablarni bajarish uchun zarur muddat davomida saqlanadi. Support orqali akkaunt va unga bogʻliq maʼlumotlarni oʻchirishni soʻrashingiz mumkin.',
      },
      {
        title: '5. Sizning huquqlaringiz',
        body:
          'Akkauntingizda profil maʼlumotlari va bildirishnoma sozlamalarini koʻrish hamda yangilash mumkin. Maʼlumotlaringiz nusxasi, tuzatish yoki oʻchirishni soʻrashingiz mumkin. Baʼzi hududlarda qoʻshimcha huquqlar ham mavjud (masalan, qayta ishlashga eʼtiroz, maʼlumotlarni ko‘chirish). Har qanday so‘rov bo‘yicha Support bilan bogʻlaning.',
      },
      {
        title: '6. Aloqa',
        body:
          'Maxfiylikka oid savollar yoki soʻrovlar uchun Support bo‘limi orqali yoki platformada ko‘rsatilgan aloqa maʼlumotlari orqali biz bilan bogʻlaning.',
      },
    ],
  },
}

function resolvePrivacyLang(language: string): 'en' | 'ru' | 'uz' {
  const code = language.toLowerCase()
  if (code.startsWith('ru')) return 'ru'
  if (code.startsWith('uz')) return 'uz'
  return 'en'
}

export function PrivacyScreen() {
  const { i18n } = useTranslation('common')
  const c = useThemeColors()
  const content = PRIVACY_COPY[resolvePrivacyLang(i18n.resolvedLanguage ?? i18n.language ?? 'en')]

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>{content.title}</Text>
        <Text style={[styles.updated, { color: c.textMuted }]}>{content.lastUpdated}</Text>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          {content.sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>{section.title}</Text>
              <Text style={[styles.sectionBody, { color: c.textMuted }]}>{section.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[4],
    paddingTop: space[6],
    paddingBottom: space[8],
  },
  title: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    marginBottom: space[1],
  },
  updated: {
    fontSize: fontSize.sm,
    marginBottom: space[6],
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[4],
    gap: space[4],
  },
  section: {
    gap: space[2],
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionBody: {
    fontSize: fontSize.sm,
    lineHeight: 21,
  },
})
