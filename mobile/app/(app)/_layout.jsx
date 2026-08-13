import { Tabs } from 'expo-router'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/src/theme/tokens'

const ICONS = {
  feed: '⌂',
  search: '⌕',
  compose: '＋',
  profile: '☺',
}

function TabGlyph({ name, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.icon, { color: focused ? colors.pink : colors.inkMuted }]}>
        {ICONS[name]}
      </Text>
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
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 58 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          elevation: 12,
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
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ focused }) => <TabGlyph name="search" focused={focused} />,
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
    minWidth: 28,
    minHeight: 24,
  },
  iconWrapActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.pink,
    paddingBottom: 2,
  },
  icon: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', marginTop: 2 },
})
