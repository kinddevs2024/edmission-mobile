import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StackNavigationProp } from '@react-navigation/stack'
import { searchMobileUniversitySitePages } from '@/constants/mobileUniversitySiteSearch'
import type { UniversityStackParamList } from '@/navigation/types'
import { searchGlobal, type SearchResult } from '@/services/search'

const DEBOUNCE_MS = 300

export function useUniversityGlobalSearch(navigation: StackNavigationProp<UniversityStackParamList>) {
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    if (!debounced.trim()) {
      setResult(null)
      return
    }
    let cancelled = false
    setLoading(true)
    searchGlobal(debounced)
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch(() => {
        if (!cancelled) setResult({ universities: [], students: [], chatMessages: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debounced])

  const sitePages = useMemo(() => searchMobileUniversitySitePages(debounced), [debounced])
  const chatMessages = result?.chatMessages ?? []

  const reset = useCallback(() => {
    setValue('')
    setDebounced('')
    setResult(null)
  }, [])

  const handleSelectUniversity = useCallback(
    (_id: string) => {
      reset()
      navigation.navigate('UniversityHome', { screen: 'UniversityDiscovery' })
    },
    [navigation, reset]
  )

  const handleSelectStudent = useCallback(
    (id: string) => {
      reset()
      navigation.navigate('UniversityStudentProfile', { studentId: id })
    },
    [navigation, reset]
  )

  const handleSelectSitePage = useCallback(
    (run: (n: StackNavigationProp<UniversityStackParamList>) => void) => {
      reset()
      run(navigation)
    },
    [navigation, reset]
  )

  const handleSelectChatMessage = useCallback(
    (_chatId: string) => {
      reset()
      navigation.navigate('UniversityHome', { screen: 'UniversityChat' })
    },
    [navigation, reset]
  )

  const handleSearchWithAI = useCallback(() => {
    reset()
    navigation.navigate('UniversityAI')
  }, [navigation, reset])

  return {
    value,
    setValue,
    debounced,
    result,
    loading,
    sitePages,
    chatMessages,
    reset,
    handleSelectUniversity,
    handleSelectStudent,
    handleSelectSitePage,
    handleSelectChatMessage,
    handleSearchWithAI,
  }
}
