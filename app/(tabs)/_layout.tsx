import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Animated } from 'react-native';
import { useRef, useState } from 'react';

export default function TabsLayout() {
    const scaleAnims = useRef([
        new Animated.Value(1),
        new Animated.Value(1),
        new Animated.Value(1),
        new Animated.Value(1),
        new Animated.Value(1),
    ]).current;

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
                            ? 'rgba(255,255,255,0.95)'
                            : '#FFFFFF',
                        borderTopColor: 'rgba(0,0,0,0.08)',
                        borderTopWidth: 1,
                        height: 70,
                        paddingBottom: 12,
                        paddingTop: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 8,
                        ...(Platform.OS === 'web' ? {
                        } as any : {}),
                    },
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: '#8E8E93',
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '600',
                        marginTop: 4,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Dashboard',
                        headerTitle: 'HYP Convert',
                        headerLeft: () => null,
                        tabBarIcon: ({ color, size, focused }) => (
                            <Animated.View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.2)' : 'transparent',
                                padding: 8,
                                borderRadius: 12,
                                transform: [{ scale: scaleAnims[0] }],
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "view-dashboard" : "view-dashboard-outline"}
                                    size={24}
                                    color={color}
                                />
                            </Animated.View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="documents"
                    options={{
                        title: 'Files',
                        headerTitle: '🗂️ Dokumen Saya',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Animated.View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.2)' : 'transparent',
                                padding: 8,
                                borderRadius: 12,
                                transform: [{ scale: scaleAnims[1] }],
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "folder-open" : "folder-outline"}
                                    size={24}
                                    color={color}
                                />
                            </Animated.View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="scanner"
                    options={{
                        title: 'Scanner',
                        headerTitle: '📷 Document Scanner',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Animated.View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.2)' : 'transparent',
                                padding: 8,
                                borderRadius: 12,
                                transform: [{ scale: scaleAnims[2] }],
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "camera-document" : "camera-document-off"}
                                    size={24}
                                    color={color}
                                />
                            </Animated.View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="convert"
                    options={{
                        title: 'Convert',
                        headerTitle: '⚡ Konversi File',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Animated.View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.2)' : 'transparent',
                                padding: 8,
                                borderRadius: 12,
                                transform: [{ scale: scaleAnims[3] }],
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "file-swap" : "file-swap-outline"}
                                    size={24}
                                    color={color}
                                />
                            </Animated.View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="history"
                    options={{
                        title: 'History',
                        headerTitle: '📊 Riwayat Konversi',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Animated.View style={{
                                backgroundColor: focused ? 'rgba(0,122,255,0.2)' : 'transparent',
                                padding: 8,
                                borderRadius: 12,
                                transform: [{ scale: scaleAnims[4] }],
                            }}>
                                <MaterialCommunityIcons
                                    name={focused ? "history" : "clock-outline"}
                                    size={24}
                                    color={color}
                                />
                            </Animated.View>
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}
