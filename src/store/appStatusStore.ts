import { create } from 'zustand'

type AppStatusState = {
  maintenance: boolean
  setMaintenance: (value: boolean) => void
}

export const useAppStatusStore = create<AppStatusState>((set) => ({
  maintenance: false,
  setMaintenance: (maintenance) => set({ maintenance }),
}))
