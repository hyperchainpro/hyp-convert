import React from 'react';
import { View, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface MaintenanceScreenProps {
    message?: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
    message = "Aplikasi sedang dalam perbaikan untuk meningkatkan kualitas layanan."
}) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.content}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="cogs" size={80} color="#FFD700" />
                            </View>
                            <Text style={styles.title}>System Maintenance</Text>
                            <Text style={styles.message}>
                                {message}
                            </Text>
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Kami akan segera kembali!</Text>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    content: {
        alignItems: 'center',
        padding: 30,
        width: '100%',
    },
    iconContainer: {
        marginBottom: 24,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 60,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    footer: {
        marginTop: 20,
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    footerText: {
        color: '#FFD700',
        fontWeight: '600',
        fontSize: 14,
    }
});
