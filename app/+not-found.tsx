import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Halaman Tidak Ditemukan', headerShown: false }} />
            <View style={styles.container}>
                <Surface style={styles.card} elevation={3}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF3B30" style={styles.icon} />
                    <Text style={styles.title}>Halaman Tidak Ditemukan</Text>
                    <Text style={styles.subtitle}>
                        Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => router.replace('/')}
                        style={styles.button}
                        buttonColor="#007AFF"
                    >
                        Kembali ke Beranda
                    </Button>
                </Surface>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        padding: 32,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        elevation: 5,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    button: {
        borderRadius: 12,
        width: '100%',
        paddingVertical: 4,
    },
});
