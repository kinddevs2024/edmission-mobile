import type { StackScreenProps } from '@react-navigation/stack'
import { useUniversityGlobalSearch } from '@/hooks/useUniversityGlobalSearch'
import type { UniversityStackParamList } from '@/navigation/types'
import { SearchScreenView, type SearchScreenHookSlice } from '@/screens/common/SearchScreenView'

type Props = StackScreenProps<UniversityStackParamList, 'Search'>

export function UniversitySearchScreen({ navigation, route }: Props) {
  const hook = useUniversityGlobalSearch(navigation)
  return (
    <SearchScreenView
      navigation={navigation}
      initialQuery={route.params?.q}
      showStudents
      hook={hook as unknown as SearchScreenHookSlice}
    />
  )
}
