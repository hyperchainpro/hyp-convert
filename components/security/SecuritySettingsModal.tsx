import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Text, Switch, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecurity } from '@/hooks/useSecurity';
import { PinPad } from '@/components/security/PinPad';

interface SecuritySettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
    visible,
    onClose,
}) => {
    const { settings, updateSettings, verifyPin } = useSecurity();
    const [view, setView] = useState<'menu' | 'create-pin' | 'confirm-pin' | 'enter-pin'>('menu');
    const [tempPin, setTempPin] = useState('');
    const [pendingToggle, setPendingToggle] = useState(false);

    useEffect(() => {
        if (visible) {
            setView('menu');
            setTempPin('');
        }
    }, [visible]);

    const handleToggleLock = async (value: boolean) => {
        if (value) {
            // Enabling: Create PIN
            setView('create-pin');
        } else {
            // Disabling: Confirm PIN first
            setPendingToggle(true);
            setView('enter-pin');
        }
    };

    const handlePinEntered = async (pin: string) => {
        if (view === 'create-pin') {
            setTempPin(pin);
            setView('confirm-pin');
        } else if (view === 'confirm-pin') {
            if (pin === tempPin) {
                await updateSettings({ isEnabled: true, pin: pin });
                setView('menu');
            } else {
                Alert.alert('Error', 'PIN tidak cocok. Silakan coba lagi.');
                setView('create-pin');
                setTempPin('');
            }
        } else if (view === 'enter-pin') {
            if (verifyPin(pin)) {
                if (pendingToggle) {
                    await updateSettings({ isEnabled: false, pin: null, useBiometrics: false });
                    setPendingToggle(false);
                }
                setView('menu');
            } else {
                Alert.alert('Error', 'PIN Salah');
            }
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {view === 'menu' ? 'Keamanan Aplikasi' :
                                view === 'create-pin' ? 'Buat PIN Baru' :
                                    view === 'confirm-pin' ? 'Konfirmasi PIN' :
                                        'Masukkan PIN'}
                        </Text>
                        <IconButton icon="close" onPress={onClose} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {view === 'menu' ? (
                            <>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingLabel}>Kunci Aplikasi</Text>
                                        <Text style={styles.settingDesc}>Minta PIN saat membuka aplikasi</Text>
                                    </View>
                                    <Switch
                                        value={settings.isEnabled}
                                        onValueChange={handleToggleLock}
                                        color="#30D158"
                                    />
                                </View>

                                {settings.isEnabled && (
                                    <View style={styles.settingRow}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingLabel}>Biometrik</Text>
                                            <Text style={styles.settingDesc}>Gunakan FaceID / Fingerprint</Text>
                                        </View>
                                        <Switch
                                            value={settings.useBiometrics}
                                            onValueChange={(val) => updateSettings({ useBiometrics: val })}
                                            color="#007AFF"
                                        />
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.pinContainer}>
                                <PinPad onPinEntered={handlePinEntered} />
                                <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn}>
                                    <Text style={styles.backText}>Batal</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 14,
        color: '#8E8E93',
    },
    pinContainer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    backBtn: {
        marginTop: 20,
        padding: 10,
    },
    backText: {
        color: '#FF3B30',
        fontSize: 16,
    }
});
