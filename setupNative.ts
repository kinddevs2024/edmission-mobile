/**
 * Load gesture handler first. Disable native RNSScreen by default on Android Fabric:
 * @react-navigation/stack otherwise mounts Screen with detachInactiveScreens=true, which can
 * trigger java.lang.String cannot be cast to java.lang.Boolean in native setProperty.
 */
import * as WebBrowser from 'expo-web-browser'
import 'react-native-gesture-handler'

WebBrowser.maybeCompleteAuthSession()
import { enableScreens } from 'react-native-screens'

enableScreens(false)
