import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, IconButton, Chip, Portal, Modal, Divider } from 'react-native-paper';
import { ReceiptData } from '@/lib/receiptExtractor';

interface ReceiptEditorProps {
    visible: boolean;
    data: ReceiptData;
    imageUri: string;
    onDismiss: () => void;
    onSave: (updatedData: ReceiptData) => void;
}

const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Lainnya'];

export function ReceiptEditor({ visible, data: initialData, imageUri, onDismiss, onSave }: ReceiptEditorProps) {
    const [data, setData] = useState<ReceiptData>(initialData);

    const updateField = (field: keyof ReceiptData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <IconButton icon="close" onPress={onDismiss} iconColor="#fff" />
                    <Text variant="titleMedium" style={styles.title}>Edit Struk</Text>
                    <Button
                        mode="contained"
                        onPress={() => onSave(data)}
                        buttonColor="#30D158"
                    >
                        Simpan
                    </Button>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Preview */}
                        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />

                        {/* Form */}
                        <View style={styles.form}>

                            {/* Merchant */}
                            <TextInput
                                label="Merchant / Toko"
                                value={data.merchant}
                                onChangeText={(text) => updateField('merchant', text)}
                                style={styles.input}
                                mode="outlined"
                                left={<TextInput.Icon icon="store" />}
                            />

                            {/* Amount & Date Row */}
                            <View style={styles.row}>
                                <TextInput
                                    label="Total (IDR)"
                                    value={data.total?.toString()}
                                    onChangeText={(text) => updateField('total', parseInt(text.replace(/[^0-9]/g, '')) || 0)}
                                    keyboardType="numeric"
                                    style={[styles.input, { flex: 1 }]}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="cash" />}
                                />
                                <View style={{ width: 8 }} />
                                <TextInput
                                    label="Tanggal"
                                    value={data.date}
                                    onChangeText={(text) => updateField('date', text)}
                                    style={[styles.input, { flex: 1 }]}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="calendar" />}
                                    placeholder="DD/MM/YYYY"
                                />
                            </View>

                            {/* Tax */}
                            <TextInput
                                label="Pajak (Opsional)"
                                value={data.tax?.toString()}
                                onChangeText={(text) => updateField('tax', parseInt(text.replace(/[^0-9]/g, '')) || 0)}
                                keyboardType="numeric"
                                style={styles.input}
                                mode="outlined"
                            />

                            {/* Category Selection */}
                            <Text style={styles.sectionLabel}>Kategori</Text>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map(cat => (
                                    <Chip
                                        key={cat}
                                        selected={data.category === cat}
                                        onPress={() => updateField('category', cat)}
                                        style={[styles.chip, data.category === cat && styles.chipSelected]}
                                        showSelectedOverlay
                                    >
                                        {cat}
                                    </Chip>
                                ))}
                            </View>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C1C1E',
        flex: 1,
        margin: 0,
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        paddingTop: Platform.OS === 'ios' ? 40 : 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1C1C1E',
    },
    title: {
        color: '#fff',
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        marginBottom: 20,
    },
    form: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
    },
    input: {
        backgroundColor: '#2C2C2E',
        fontSize: 14,
    },
    sectionLabel: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: '#2C2C2E',
    },
    chipSelected: {
        backgroundColor: 'rgba(48, 209, 88, 0.2)', // Green tint
    },
});
