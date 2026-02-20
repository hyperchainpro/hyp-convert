import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, IconButton, Chip, Surface, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { BusinessCardContact } from '@/lib/businessCardExtractor';
import { router } from 'expo-router';

interface ContactEditorProps {
    visible: boolean;
    contact: BusinessCardContact;
    imageUri: string;
    onDismiss: () => void;
    onSave: (updatedContact: BusinessCardContact) => void;
}

export function ContactEditor({ visible, contact: initialContact, imageUri, onDismiss, onSave }: ContactEditorProps) {
    const [contact, setContact] = useState<BusinessCardContact>(initialContact);
    const [saving, setSaving] = useState(false);

    const handleSaveToContacts = async () => {
        setSaving(true);
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const contactData: Contacts.Contact = {
                    contactType: Contacts.ContactTypes.Person,
                    name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.name || 'Unknown',
                    firstName: contact.firstName || contact.name?.split(' ')[0] || 'Unknown',
                    lastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
                    company: contact.company,
                    jobTitle: contact.title,
                    phoneNumbers: contact.phones.map(p => ({
                        label: 'mobile',
                        number: p,
                    })),
                    emails: contact.emails.map(e => ({
                        label: 'work',
                        email: e,
                        id: e, // id is required in some versions but typically ignored for new contacts
                    })),
                    addresses: contact.addresses.map(a => ({
                        label: 'work',
                        street: a,
                    })),
                    urlAddresses: contact.websites.map(w => ({
                        label: 'website',
                        url: w,
                    })),
                    imageAvailable: true,
                };

                await Contacts.addContactAsync(contactData);
                Alert.alert('Sukses', 'Kontak berhasil disimpan!');
                onSave(contact);
            } else {
                Alert.alert('Izin Ditolak', 'Kami memerlukan izin kontak untuk menyimpan.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal menyimpan kontak.');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof BusinessCardContact, value: string) => {
        setContact(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <IconButton icon="close" onPress={onDismiss} iconColor="#fff" />
                    <Text variant="titleMedium" style={styles.title}>Edit Kontak</Text>
                    <Button
                        mode="contained"
                        onPress={handleSaveToContacts}
                        loading={saving}
                        buttonColor="#007AFF"
                    >
                        Simpan
                    </Button>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Card Preview */}
                        <Image source={{ uri: imageUri }} style={styles.cardPreview} resizeMode="contain" />

                        {/* Form */}
                        <View style={styles.form}>
                            <TextInput
                                label="Nama Lengkap"
                                value={contact.name}
                                onChangeText={(text) => updateField('name', text)}
                                style={styles.input}
                                mode="outlined"
                                left={<TextInput.Icon icon="account" />}
                            />
                            <View style={styles.row}>
                                <TextInput
                                    label="Perusahaan"
                                    value={contact.company}
                                    onChangeText={(text) => updateField('company', text)}
                                    style={[styles.input, { flex: 1 }]}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="domain" />}
                                />
                                <View style={{ width: 8 }} />
                                <TextInput
                                    label="Jabatan"
                                    value={contact.title}
                                    onChangeText={(text) => updateField('title', text)}
                                    style={[styles.input, { flex: 1 }]}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="briefcase" />}
                                />
                            </View>

                            <Text style={styles.sectionLabel}>Telepon</Text>
                            {contact.phones.map((phone, idx) => (
                                <TextInput
                                    key={idx}
                                    value={phone}
                                    onChangeText={(text) => {
                                        const newPhones = [...contact.phones];
                                        newPhones[idx] = text;
                                        setContact(prev => ({ ...prev, phones: newPhones }));
                                    }}
                                    style={styles.input}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="phone" />}
                                    right={<TextInput.Icon icon="delete" onPress={() => {
                                        const newPhones = contact.phones.filter((_, i) => i !== idx);
                                        setContact(prev => ({ ...prev, phones: newPhones }));
                                    }} />}
                                />
                            ))}
                            <Button
                                mode="text"
                                icon="plus"
                                onPress={() => setContact(prev => ({ ...prev, phones: [...prev.phones, ''] }))}
                            >
                                Tambah Telepon
                            </Button>

                            <Text style={styles.sectionLabel}>Email</Text>
                            {contact.emails.map((email, idx) => (
                                <TextInput
                                    key={idx}
                                    value={email}
                                    onChangeText={(text) => {
                                        const newEmails = [...contact.emails];
                                        newEmails[idx] = text;
                                        setContact(prev => ({ ...prev, emails: newEmails }));
                                    }}
                                    style={styles.input}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="email" />}
                                    keyboardType="email-address"
                                    right={<TextInput.Icon icon="delete" onPress={() => {
                                        const newEmails = contact.emails.filter((_, i) => i !== idx);
                                        setContact(prev => ({ ...prev, emails: newEmails }));
                                    }} />}
                                />
                            ))}

                            <Text style={styles.sectionLabel}>Alamat</Text>
                            {contact.addresses.map((addr, idx) => (
                                <TextInput
                                    key={idx}
                                    value={addr}
                                    onChangeText={(text) => {
                                        const newAdrs = [...contact.addresses];
                                        newAdrs[idx] = text;
                                        setContact(prev => ({ ...prev, addresses: newAdrs }));
                                    }}
                                    style={styles.input}
                                    mode="outlined"
                                    multiline
                                    left={<TextInput.Icon icon="map-marker" />}
                                />
                            ))}

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
    cardPreview: {
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
});
