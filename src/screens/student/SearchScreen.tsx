import type { StackScreenProps } from '@react-navigation/stack'
import { useStudentGlobalSearch } from '@/hooks/useStudentGlobalSearch'
import { useAuth } from '@/hooks/useAuth'
import type { StudentStackParamList } from '@/navigation/types'
import { SearchScreenView, type SearchScreenHookSlice } from '@/screens/common/SearchScreenView'

type Props = StackScreenProps<StudentStackParamList, 'Search'>

export function SearchScreen({ navigation, route }: Props) {
  const { user } = useAuth()
  const hook = useStudentGlobalSearch(navigation)
  return (
    <SearchScreenView
      navigation={navigation}
      initialQuery={route.params?.q}
      showStudents={user?.role !== 'student'}
      hook={hook as unknown as SearchScreenHookSlice}
    />
  )
}
