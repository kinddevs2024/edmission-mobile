import NetInfo, { useNetInfo, type NetInfoState } from '@react-native-community/netinfo'
import { useCallback } from 'react'

export function isEffectivelyOffline(state: NetInfoState): boolean {
  if (state.isConnected === false) return true
  if (state.isInternetReachable === false) return true
  return false
}

/** Subscribes to connectivity; `refresh` re-runs the native/web check (e.g. after user enables Wi‑Fi). */
export function useOnlineStatus() {
  const netInfo = useNetInfo()
  const refresh = useCallback(() => NetInfo.refresh(), [])
  return {
    isOffline: isEffectivelyOffline(netInfo),
    refresh,
    netInfo,
  }
}
