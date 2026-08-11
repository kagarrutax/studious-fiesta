import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/src/theme/tokens'

const ICONS = {
  feed: { on: 'home', off: 'home-outline' },
  compose: { on: 'add-circle', off: 'add-circle-outline' },
  profile: { on: 'person', off: 'person-outline' },
}

function TabGlyph({ name, focused }) {
  const set = ICONS[name]
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? set.on : set.off}
        size={name === 'compose' ? 26 : 22}
        color={focused ? colors.pink : colors.inkMuted}
      />
    </View>
  )
}

export default function AppTabsLayout() {
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8)

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 58 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabGlyph name="feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: 'Crear',
          tabBarIcon: ({ focused }) => <TabGlyph name="compose" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabGlyph name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 28,
  },
  iconWrapActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.pink,
    paddingBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  item: {
    paddingTop: 2,
  },
})
