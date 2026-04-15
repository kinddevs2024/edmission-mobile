import { useLayoutEffect } from 'react'
import type { StackScreenProps } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { EmbeddedWebAppScreen } from '@/screens/common/EmbeddedWebAppScreen'
import type { UniversityStackParamList } from '@/navigation/types'

type FlyerProps = StackScreenProps<UniversityStackParamList, 'UniversityFlyerEditorNew'>
type TplNewProps = StackScreenProps<UniversityStackParamList, 'DocumentTemplateEditorNew'>
type TplEditProps = StackScreenProps<UniversityStackParamList, 'DocumentTemplateEditor'>

export function UniversityFlyerEditorWebScreen({ navigation }: FlyerProps) {
  const { t } = useTranslation('university')
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('flyers.createWithEditor') })
  }, [navigation, t])
  return <EmbeddedWebAppScreen webPath="/university/flyers/new" onCloseRequest={() => navigation.goBack()} />
}

export function DocumentTemplateEditorNewWebScreen({ navigation }: TplNewProps) {
  const { t } = useTranslation('documents')
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('universityDocuments.createTemplate') })
  }, [navigation, t])
  return (
    <EmbeddedWebAppScreen
      webPath="/university/documents/templates/new"
      onCloseRequest={() => navigation.goBack()}
    />
  )
}

export function DocumentTemplateEditorWebScreen({ navigation, route }: TplEditProps) {
  const { t } = useTranslation('documents')
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('universityDocuments.tabs.templates') })
  }, [navigation, t])
  const id = route.params.id
  return (
    <EmbeddedWebAppScreen
      webPath={`/university/documents/templates/${id}/edit`}
      onCloseRequest={() => navigation.goBack()}
    />
  )
}
