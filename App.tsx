import { StatusBar } from 'expo-status-bar'
import { AppProviders } from '@/bootstrap/providers'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

export default function App() {
  return (
    <AppErrorBoundary>
      <StatusBar style="dark" />
      <AppProviders />
    </AppErrorBoundary>
  )
}
