import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import type { AuthStackParamList } from '@/navigation/types'
import { fetchTrustedUniversityLogoPage } from '@/services/public'
import { useThemeColors } from '@/theme'
import { getImageUrl } from '@/utils/imageUrl'

type Props = StackScreenProps<AuthStackParamList, 'Landing'>

const appIconNative = require('../../../assets/icon.png')
const LOGO_CARD_HEIGHT = 70
const LOGO_GAP = 10
const TRUSTED_LOGOS_PAGE_SIZE = 18
const VISIBLE_LOGOS_PER_COLUMN = 7
const COLUMN_A_DURATION_MS = 42000
const COLUMN_B_DURATION_MS = 46000
const BACKGROUND_FETCH_DELAY_MS = 550
const LOGO_REFETCH_INTERVAL_MS = 45_000
const LOGO_TOP_FADE_HEIGHT = 96

function LogoColumn({
  items,
  durationMs,
  minVisibleRows,
}: {
  items: string[]
  durationMs: number
  minVisibleRows: number
}) {
  const progress = useRef(new Animated.Value(0)).current
  const [failedUris, setFailedUris] = useState<Record<string, true>>({})
  const visibleItems = useMemo(() => items.filter((uri) => !failedUris[uri]), [items, failedUris])
  const minItemsForLoop = Math.max(2, minVisibleRows + 2)
  const animationItems = useMemo(() => {
    if (visibleItems.length === 0) return []
    if (visibleItems.length >= minItemsForLoop) return visibleItems
    const out: string[] = []
    while (out.length < minItemsForLoop) {
      for (const uri of visibleItems) {
        out.push(uri)
        if (out.length >= minItemsForLoop) break
      }
    }
    return out
  }, [minItemsForLoop, visibleItems])
  const headCount = useMemo(
    () => Math.min(animationItems.length, Math.max(1, minVisibleRows + 1)),
    [animationItems.length, minVisibleRows]
  )
  const loopedItems = useMemo(
    () => [...animationItems, ...animationItems.slice(0, headCount)],
    [animationItems, headCount]
  )
  const stride = useMemo(
    () => (LOGO_CARD_HEIGHT + LOGO_GAP) * animationItems.length,
    [animationItems.length]
  )

  useEffect(() => {
    setFailedUris((prev) => {
      const active = new Set(items)
      const next = Object.keys(prev).reduce<Record<string, true>>((acc, uri) => {
        if (active.has(uri)) acc[uri] = true
        return acc
      }, {})
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  }, [items])

  useEffect(() => {
    if (stride <= 0) return
    progress.setValue(0)
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [durationMs, progress, stride, loopedItems.length])

  if (loopedItems.length === 0 || stride <= 0) {
    return <View style={styles.logoColumnViewport} />
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -stride],
  })

  return (
    <View style={styles.logoColumnViewport}>
      <Animated.View style={[styles.logoColumnTrack, { transform: [{ translateY }] }]}>
        {loopedItems.map((uri, idx) => (
          <View
            key={`${uri}-${idx}`}
            style={styles.logoCard}
          >
            <Image
              source={{ uri }}
              style={styles.carouselLogo}
              resizeMode="contain"
              fadeDuration={0}
              onError={() =>
                setFailedUris((prev) => {
                  if (prev[uri]) return prev
                  return { ...prev, [uri]: true }
                })
              }
            />
          </View>
        ))}
      </Animated.View>
    </View>
  )
}

function splitCarouselColumns(urls: string[]): [string[], string[]] {
  if (urls.length === 0) return [[], []]
  if (urls.length === 1) return [[urls[0]], [urls[0]]]
  let a = urls.filter((_, i) => i % 2 === 0)
  let b = urls.filter((_, i) => i % 2 === 1)
  if (a.length === 0 && b.length > 0) {
    const m = Math.ceil(b.length / 2)
    a = b.slice(0, m)
    b = b.slice(m)
  } else if (b.length === 0 && a.length > 0) {
    if (a.length === 1) return [[a[0]], [a[0]]]
    const m = Math.ceil(a.length / 2)
    b = a.slice(m)
    a = a.slice(0, m)
  }
  return [a, b]
}

function normalizeLogoUrls(rawUrls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const candidate of rawUrls) {
    const url = candidate.trim()
    if (!url) continue
    const lower = url.toLowerCase()
    if (lower.includes('/landing/')) continue
    if (lower.includes('group-78.png')) continue
    if (seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

function createRotatingPool(urls: string[], startIndex: number, size: number): string[] {
  if (urls.length === 0 || size <= 0) return []
  if (urls.length <= size) return urls
  const out: string[] = []
  const safeStart = ((startIndex % urls.length) + urls.length) % urls.length
  for (let i = 0; i < size; i += 1) {
    out.push(urls[(safeStart + i) % urls.length])
  }
  return out
}

function withZeroAlpha(color: string): string {
  const hex3 = /^#([0-9a-f]{3})$/i.exec(color)
  if (hex3) {
    const [r, g, b] = hex3[1].split('')
    return `#${r}${r}${g}${g}${b}${b}00`
  }
  if (/^#([0-9a-f]{6})$/i.test(color)) return `${color}00`
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(color)
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, 0)`
  const rgba = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([^)]+)\)$/i.exec(color)
  if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, 0)`
  return 'transparent'
}

export function LandingScreen({ navigation }: Props) {
  const { t } = useTranslation('common')
  const c = useThemeColors()
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const web = Platform.OS === 'web'
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const transparentBackground = useMemo(() => withZeroAlpha(c.background), [c.background])

  const logosQuery = useInfiniteQuery({
    queryKey: ['trustedUniversityLogos', 'landing', TRUSTED_LOGOS_PAGE_SIZE],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchTrustedUniversityLogoPage({
        limit: TRUSTED_LOGOS_PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 5 * 60 * 1000,
    refetchInterval: LOGO_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = logosQuery

  const fetchedUrls = useMemo(() => {
    const pages = logosQuery.data?.pages ?? []
    return normalizeLogoUrls(
      pages.flatMap((page) =>
        page.items
          .map((logo) => getImageUrl(logo.logoUrl))
          .filter((url): url is string => Boolean(url))
      )
    )
  }, [logosQuery.data?.pages])

  const readyUrls = fetchedUrls
  const [carouselHeight, setCarouselHeight] = useState(0)
  const visibleRowsPerColumn =
    carouselHeight > 0
      ? Math.max(1, Math.ceil(carouselHeight / (LOGO_CARD_HEIGHT + LOGO_GAP)))
      : VISIBLE_LOGOS_PER_COLUMN
  const animationPoolSize = Math.max(visibleRowsPerColumn * 4, visibleRowsPerColumn + 4)
  const lowLogoBufferThreshold = visibleRowsPerColumn * 6
  const [poolA, poolB] = useMemo(() => splitCarouselColumns(readyUrls), [readyUrls])
  const [columnAStart, setColumnAStart] = useState(0)
  const [columnBStart, setColumnBStart] = useState(0)
  const isLogoBufferLow = readyUrls.length < lowLogoBufferThreshold

  const handleCarouselLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.max(0, Math.round(event.nativeEvent.layout.height))
    setCarouselHeight((prev) => (prev === nextHeight ? prev : nextHeight))
  }

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const timer = setTimeout(() => {
      void fetchNextPage()
    }, fetchedUrls.length === 0 || isLogoBufferLow ? 0 : BACKGROUND_FETCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [fetchNextPage, fetchedUrls.length, hasNextPage, isFetchingNextPage, isLogoBufferLow])

  useEffect(() => {
    setColumnAStart((prev) => (poolA.length > 0 ? prev % poolA.length : 0))
  }, [poolA.length])

  useEffect(() => {
    setColumnBStart((prev) => (poolB.length > 0 ? prev % poolB.length : 0))
  }, [poolB.length])

  useEffect(() => {
    if (poolA.length <= animationPoolSize) return
    const timer = setInterval(() => {
      setColumnAStart((prev) => (prev + visibleRowsPerColumn) % poolA.length)
    }, COLUMN_A_DURATION_MS)
    return () => clearInterval(timer)
  }, [animationPoolSize, poolA.length, visibleRowsPerColumn])

  useEffect(() => {
    if (poolB.length <= animationPoolSize) return
    const timer = setInterval(() => {
      setColumnBStart((prev) => (prev + visibleRowsPerColumn) % poolB.length)
    }, COLUMN_B_DURATION_MS)
    return () => clearInterval(timer)
  }, [animationPoolSize, poolB.length, visibleRowsPerColumn])

  const animatedPoolA = useMemo(
    () => createRotatingPool(poolA, columnAStart, animationPoolSize),
    [animationPoolSize, columnAStart, poolA]
  )
  const animatedPoolB = useMemo(
    () => createRotatingPool(poolB, columnBStart, animationPoolSize),
    [animationPoolSize, columnBStart, poolB]
  )
  const showCarousel = animatedPoolA.length > 0 && animatedPoolB.length > 0

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <View
        style={[
          styles.main,
          web && { minHeight: windowHeight, flex: 1 },
        ]}
      >
        <View style={styles.body}>
          <View style={styles.brandBlock}>
            {web ? (
              <Image
                source={{ uri: isDark ? '/landing/edmission-logo-light.svg' : '/landing/edmission-logo.svg' }}
                style={styles.wordmark}
                resizeMode="contain"
                accessibilityRole="image"
                accessibilityLabel={t('common:appName', 'Edmission')}
              />
            ) : (
              <View style={styles.nativeBrandLockup}>
                <Image source={appIconNative} style={styles.nativeBrandIcon} resizeMode="contain" />
                <Text style={[styles.nativeBrandWordmark, { color: c.text }]}>{t('common:appName', 'Edmission')}</Text>
              </View>
            )}
          </View>

          <View style={styles.carouselSection} onLayout={handleCarouselLayout}>
            {showCarousel ? (
              <View style={styles.carouselRow}>
                <View style={styles.columnShell}>
                  <LogoColumn
                    items={animatedPoolA}
                    durationMs={COLUMN_A_DURATION_MS}
                    minVisibleRows={visibleRowsPerColumn}
                  />
                </View>
                <View style={styles.columnShell}>
                  <LogoColumn
                    items={animatedPoolB}
                    durationMs={COLUMN_B_DURATION_MS}
                    minVisibleRows={visibleRowsPerColumn}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.carouselPlaceholder}>
                <ActivityIndicator color={c.primary} size="large" />
              </View>
            )}
            <LinearGradient
              pointerEvents="none"
              colors={[c.background, transparentBackground]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.carouselTopFade}
            />
          </View>
        </View>

        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: c.card,
              borderTopColor: c.border,
              paddingBottom: Math.max(insets.bottom, 16),
              paddingTop: 14,
            },
            styles.bottomBarShadow,
          ]}
        >
          <Pressable style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryLabel}>{t('common:login')}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryBtn, { backgroundColor: c.background }]} onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.secondaryLabel, { color: c.text }]}>{t('common:register')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Privacy')} style={styles.privacyLinkWrap}>
            <Text style={[styles.link, { color: c.primary }]}>{t('common:privacy', 'Privacy')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
  },
  main: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  brandBlock: {
    paddingTop: 2,
    paddingBottom: 14,
    alignItems: 'center',
  },
  bottomBar: {
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    flexShrink: 0,
    marginTop: 'auto',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomBarShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -10px 24px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  wordmark: {
    width: 208,
    height: 72,
    alignSelf: 'center',
  },
  nativeBrandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nativeBrandIcon: {
    width: 54,
    height: 54,
  },
  nativeBrandWordmark: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  carouselSection: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  carouselPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: 120,
  },
  carouselRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    minHeight: 0,
  },
  columnShell: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  logoColumnViewport: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden',
    position: 'relative',
  },
  logoColumnTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  carouselTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: LOGO_TOP_FADE_HEIGHT,
    zIndex: 3,
  },
  logoCard: {
    height: LOGO_CARD_HEIGHT,
    borderWidth: 0,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LOGO_GAP,
    paddingHorizontal: 10,
  },
  carouselLogo: { width: '100%', height: 50 },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryLabel: { fontSize: 16, fontWeight: '600' },
  privacyLinkWrap: { alignItems: 'center', paddingVertical: 4 },
  link: { textAlign: 'center', fontSize: 14 },
})
