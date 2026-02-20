import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';

export default function TabsLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Tabs
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.8)' : '#FFFFFF',
                        ...(Platform.OS === 'web' ? {
                            borderBottomWidth: 0.5,
                            borderBottomColor: 'rgba(0,0,0,0.1)',
                        } as any : {}),
                    },
                    headerTintColor: '#000000',
                    headerTitleStyle: {
                        fontWeight: '700',
                        fontSize: 17,
                    },
                    headerShadowVisible: false,
                    headerLeft: ({ canGoBack }: any) => {
                        // Don't show back button on dashboard (index)
                        // Actually, we can't easily filter by route name inside screenOptions function without context.
                        // We will override this in the 'index' screen options below.
                        return (
                            <View style={{ marginLeft: 16 }}>
                                <MaterialCommunityIcons
                                    name="arrow-left"
                                    size={24}
                                    color="#007AFF"
                                    onPress={() => {
                                        if (router.canGoBack()) {
                                            router.back();
                                        } else {
                                            router.replace('/(tabs)');
                                        }
                                    }}
                                />
                            </View>
                        );
                    },
                    tabBarStyle: {
                        backgroundColor: Platform.OS === 'web'
                            ? 'rgba(255,255,255,0.85)'
                            : '#FFFFFF',
                        borderTopColor: 'rgba(0,0,0,0.1)',
                        borderTopWidth: 0.5,
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                        ...(Platform.OS === 'web' ? {
                        } as any : {}),
                    },
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: '#8E8E93',
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Dashboard',
                        headerTitle: 'HYP Convert',
                        headerLeft: () => null, // No back button on Dashboard
                        tabBarIcon: ({ color, size, focused }) => (
                            <View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.15)' : 'transparent',
                                padding: 6,
                                borderRadius: 10,
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "view-dashboard" : "view-dashboard-outline"}
                                    size={22}
                                    color={color}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="documents"
                    options={{
                        title: 'Dokumen',
                        headerTitle: '🗂️ Dokumen Saya',
                        tabBarIcon: ({ color, size, focused }) => (
                            <View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.15)' : 'transparent',
                                padding: 6,
                                borderRadius: 10,
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "folder-open" : "folder-outline"}
                                    size={22}
                                    color={color}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="scanner"
                    options={{
                        title: 'Scanner',
                        headerTitle: '📷 Document Scanner',
                        tabBarIcon: ({ color, size, focused }) => (
                            <View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.15)' : 'transparent',
                                padding: 6,
                                borderRadius: 10,
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "camera-document" : "camera-document-off"}
                                    size={22}
                                    color={color}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="convert"
                    options={{
                        title: 'Konversi',
                        headerTitle: '⚡ Konversi File',
                        tabBarIcon: ({ color, size, focused }) => (
                            <View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.15)' : 'transparent',
                                padding: 6,
                                borderRadius: 10,
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "file-swap" : "file-swap-outline"}
                                    size={22}
                                    color={color}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="history"
                    options={{
                        title: 'Riwayat',
                        headerTitle: '📊 Riwayat Konversi',
                        tabBarIcon: ({ color, size, focused }) => (
                            <View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.15)' : 'transparent',
                                padding: 6,
                                borderRadius: 10,
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "history" : "clock-outline"}
                                    size={22}
                                    color={color}
                                />
                            </View>
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}
