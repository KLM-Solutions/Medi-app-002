import { Tabs } from 'expo-router';
import { Home, History, Pill, Info, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { TouchableOpacity, Text, Image, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Food Analyzer',
          tabBarLabel: 'Analysis',
          headerStyle: { 
            backgroundColor: colors.primary,
            ...(Platform.OS === 'ios' ? { paddingBottom: 20 } : {})
          },
          headerTitleStyle: {
            ...(Platform.OS === 'ios' ? { marginBottom: 20 } : {})
          },
          headerTintColor: colors.background,
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          headerRight: () => (
            isSignedIn ? (
              <TouchableOpacity
                style={{
                  marginRight: 15,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  overflow: 'hidden',
                  ...(Platform.OS === 'ios' ? { marginBottom: 20 } : {})
                }}
                onPress={() => router.push('/profile')}
              >
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: colors.background,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>
                      {user?.firstName?.[0] || 'U'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  marginRight: 15,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 5,
                  backgroundColor: colors.background,
                }}
                onPress={() => router.push('/sign-up')}
              >
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.background }}>Sign In</Text>
              </TouchableOpacity>
            )
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
          href: null,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.background,
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 15, marginRight: 10 }}
              onPress={() => router.replace('/(tabs)')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.background} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <History color={color} size={24}/>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history/[id]"
        options={{
          title: 'Session',
          href: null,
          headerShown: true,
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <History color={color} size={24}/>,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.background,
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 15, marginRight: 10 }}
              onPress={() => router.replace('/(tabs)/history')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.background} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Medications',
          tabBarLabel: 'Meds',
          tabBarIcon: ({ color }) => <Pill color={color} size={24} />,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.background,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarLabel: 'About',
          tabBarIcon: ({ color }) => <Info color={color} size={24} />,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.background,
        }}
      />
    </Tabs>
  );
}