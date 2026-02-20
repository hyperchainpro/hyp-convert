import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PinPadProps {
    pinLength?: number;
    onPinEntered: (pin: string) => void;
}

const { width } = Dimensions.get('window');

export function PinPad({ pinLength = 4, onPinEntered }: PinPadProps) {
    const [pin, setPin] = useState('');

    const handlePress = (key: string) => {
        if (key === 'backspace') {
            setPin(prev => prev.slice(0, -1));
        } else if (pin.length < pinLength) {
            const newPin = pin + key;
            setPin(newPin);
            if (newPin.length === pinLength) {
                // Tiny delay to show the last dot
                setTimeout(() => {
                    onPinEntered(newPin);
                    setPin('');
                }, 100);
            }
        }
    };

    return (
        <View style={styles.container}>
            {/* Dots Display */}
            <View style={styles.dotsContainer}>
                {[...Array(pinLength)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i < pin.length ? styles.dotFilled : undefined
                        ]}
                    />
                ))}
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
                {[
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['biometric', '0', 'backspace']
                ].map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((key) => {
                            if (key === 'biometric') {
                                return (
                                    <View key={key} style={styles.keyContainer} />
                                );
                            }
                            if (key === 'backspace') {
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={styles.keyContainer}
                                        onPress={() => handlePress(key)}
                                    >
                                        <MaterialCommunityIcons name="backspace-outline" size={28} color="#fff" />
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={styles.keyContainer}
                                    onPress={() => handlePress(key)}
                                >
                                    <View style={styles.keyCircle}>
                                        <Text style={styles.keyText}>{key}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 50,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    dotFilled: {
        backgroundColor: '#fff',
    },
    keypad: {
        width: width * 0.8,
        gap: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    keyContainer: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '500',
    },
});
