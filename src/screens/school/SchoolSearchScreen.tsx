import type { StackScreenProps } from '@react-navigation/stack'
import { useSchoolGlobalSearch } from '@/hooks/useSchoolGlobalSearch'
import type { SchoolStackParamList } from '@/navigation/types'
import { SearchScreenView, type SearchScreenHookSlice } from '@/screens/common/SearchScreenView'

type Props = StackScreenProps<SchoolStackParamList, 'Search'>

export function SchoolSearchScreen({ navigation, route }: Props) {
  const hook = useSchoolGlobalSearch(navigation)
  return (
    <SearchScreenView
      navigation={navigation}
      initialQuery={route.params?.q}
      showStudents
      hook={hook as unknown as SearchScreenHookSlice}
    />
  )
}
