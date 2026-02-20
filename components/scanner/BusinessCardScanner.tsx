/**
 * Business Card Scanner Component
 * iOS-style interface for scanning and extracting business card information
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Platform,
    Alert,
    Linking,
} from 'react-native';
import { Text, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';

import {
    extractBusinessCard,
    BusinessCardContact,
    formatContactForDisplay,
    contactToVCard,
} from '@/lib/businessCardExtractor';

// =====================================================
// TYPES
// =====================================================

interface BusinessCardScannerProps {
    onClose?: () => void;
    onCardSaved?: (contact: BusinessCardContact) => void;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function BusinessCardScanner({
    onClose,
    onCardSaved,
}: BusinessCardScannerProps) {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [contact, setContact] = useState<BusinessCardContact | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editedContact, setEditedContact] = useState<BusinessCardContact | null>(null);

    // Pick image from gallery
    const pickImage = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [7, 4], // Business card aspect ratio
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            processCard(result.assets[0].uri);
        }
    }, []);

    // Take photo with camera
    const takePhoto = useCallback(async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Camera access is needed to scan business cards.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [7, 4],
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            processCard(result.assets[0].uri);
        }
    }, []);

    // Process the business card
    const processCard = useCallback(async (uri: string) => {
        setIsProcessing(true);
        try {
            const result = await extractBusinessCard(uri);
            if (result.success) {
                setContact(result.contact);
                setEditedContact(result.contact);
            } else {
                Alert.alert('Error', result.error || 'Failed to extract contact info');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to process business card');
        }
        setIsProcessing(false);
    }, []);

    // Save to device contacts
    const saveToContacts = useCallback(async () => {
        if (!editedContact) return;

        const permission = await Contacts.requestPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Contacts access is needed to save the contact.');
            return;
        }

        try {
            const newContact: any = {
                contactType: Contacts.ContactTypes.Person,
                firstName: editedContact.firstName || editedContact.name?.split(' ')[0] || '',
                lastName: editedContact.lastName || editedContact.name?.split(' ').slice(1).join(' ') || '',
                company: editedContact.company || '',
                jobTitle: editedContact.title || '',
                phoneNumbers: editedContact.phones.map(phone => ({
                    number: phone,
                    label: 'work',
                })),
                emails: editedContact.emails.map(email => ({
                    email,
                    label: 'work',
                })),
                urlAddresses: editedContact.websites.map(url => ({
                    url,
                    label: 'work',
                })),
            };

            await Contacts.addContactAsync(newContact);
            Alert.alert('Success', 'Contact saved successfully!');
            onCardSaved?.(editedContact);
        } catch (error) {
            Alert.alert('Error', 'Failed to save contact');
        }
    }, [editedContact, onCardSaved]);

    // Quick actions
    const callPhone = useCallback(() => {
        if (editedContact?.phones[0]) {
            Linking.openURL(`tel:${editedContact.phones[0]}`);
        }
    }, [editedContact]);

    const sendEmail = useCallback(() => {
        if (editedContact?.emails[0]) {
            Linking.openURL(`mailto:${editedContact.emails[0]}`);
        }
    }, [editedContact]);

    const openWebsite = useCallback(() => {
        if (editedContact?.websites[0]) {
            let url = editedContact.websites[0];
            if (!url.startsWith('http')) url = 'https://' + url;
            Linking.openURL(url);
        }
    }, [editedContact]);

    // Update edited contact field
    const updateField = (field: keyof BusinessCardContact, value: any) => {
        if (editedContact) {
            setEditedContact({ ...editedContact, [field]: value });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#1C1C1E', '#2C2C2E']}
                style={styles.header}
            >
                <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                    <MaterialCommunityIcons name="close" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Card Scanner</Text>
                {editMode ? (
                    <TouchableOpacity
                        onPress={() => setEditMode(false)}
                        style={styles.headerBtn}
                    >
                        <Text style={styles.headerBtnText}>Done</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => contact && setEditMode(true)}
                        style={styles.headerBtn}
                        disabled={!contact}
                    >
                        <Text style={[styles.headerBtnText, !contact && { opacity: 0.3 }]}>Edit</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Card Preview */}
                <View style={styles.cardPreview}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.cardImage} />
                    ) : (
                        <LinearGradient
                            colors={['#2C2C2E', '#3C3C3E']}
                            style={styles.cardPlaceholder}
                        >
                            <MaterialCommunityIcons name="card-account-details-outline" size={64} color="#8E8E93" />
                            <Text style={styles.placeholderText}>Scan a business card</Text>
                        </LinearGradient>
                    )}

                    {isProcessing && (
                        <View style={styles.processingOverlay}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.processingText}>Extracting contact info...</Text>
                        </View>
                    )}
                </View>

                {/* Scan Buttons */}
                {!contact && (
                    <View style={styles.scanButtons}>
                        <TouchableOpacity style={styles.scanBtn} onPress={takePhoto}>
                            <LinearGradient
                                colors={['#007AFF', '#0051D4']}
                                style={styles.scanBtnGradient}
                            >
                                <MaterialCommunityIcons name="camera" size={24} color="#fff" />
                                <Text style={styles.scanBtnText}>Take Photo</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.scanBtn} onPress={pickImage}>
                            <LinearGradient
                                colors={['#5856D6', '#3634A3']}
                                style={styles.scanBtnGradient}
                            >
                                <MaterialCommunityIcons name="image" size={24} color="#fff" />
                                <Text style={styles.scanBtnText}>Choose Image</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Contact Info */}
                {contact && editedContact && (
                    <View style={styles.contactContainer}>
                        {/* Quick Actions */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={[styles.quickActionBtn, !editedContact.phones[0] && styles.disabled]}
                                onPress={callPhone}
                                disabled={!editedContact.phones[0]}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: '#30D158' }]}>
                                    <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                                </View>
                                <Text style={styles.quickActionLabel}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickActionBtn, !editedContact.emails[0] && styles.disabled]}
                                onPress={sendEmail}
                                disabled={!editedContact.emails[0]}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: '#007AFF' }]}>
                                    <MaterialCommunityIcons name="email" size={20} color="#fff" />
                                </View>
                                <Text style={styles.quickActionLabel}>Email</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickActionBtn, !editedContact.websites[0] && styles.disabled]}
                                onPress={openWebsite}
                                disabled={!editedContact.websites[0]}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: '#5856D6' }]}>
                                    <MaterialCommunityIcons name="web" size={20} color="#fff" />
                                </View>
                                <Text style={styles.quickActionLabel}>Website</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Contact Fields */}
                        <View style={styles.fieldsContainer}>
                            <ContactField
                                icon="account"
                                label="Name"
                                value={editedContact.name || ''}
                                editable={editMode}
                                onChangeText={(val) => updateField('name', val)}
                            />
                            <ContactField
                                icon="briefcase"
                                label="Title"
                                value={editedContact.title || ''}
                                editable={editMode}
                                onChangeText={(val) => updateField('title', val)}
                            />
                            <ContactField
                                icon="domain"
                                label="Company"
                                value={editedContact.company || ''}
                                editable={editMode}
                                onChangeText={(val) => updateField('company', val)}
                            />
                            <ContactField
                                icon="phone"
                                label="Phone"
                                value={editedContact.phones.join(', ')}
                                editable={editMode}
                                onChangeText={(val) => updateField('phones', val.split(',').map(s => s.trim()))}
                            />
                            <ContactField
                                icon="email"
                                label="Email"
                                value={editedContact.emails.join(', ')}
                                editable={editMode}
                                onChangeText={(val) => updateField('emails', val.split(',').map(s => s.trim()))}
                            />
                            <ContactField
                                icon="web"
                                label="Website"
                                value={editedContact.websites.join(', ')}
                                editable={editMode}
                                onChangeText={(val) => updateField('websites', val.split(',').map(s => s.trim()))}
                            />
                            <ContactField
                                icon="map-marker"
                                label="Address"
                                value={editedContact.addresses.join(', ')}
                                editable={editMode}
                                onChangeText={(val) => updateField('addresses', [val])}
                                multiline
                            />
                        </View>

                        {/* Confidence Score */}
                        <View style={styles.confidenceContainer}>
                            <Text style={styles.confidenceLabel}>Recognition Confidence</Text>
                            <View style={styles.confidenceBar}>
                                <View
                                    style={[
                                        styles.confidenceFill,
                                        { width: `${Math.min(100, contact.confidence)}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.confidenceValue}>
                                {Math.round(contact.confidence)}%
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            {contact && (
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.rescanBtn} onPress={() => {
                        setContact(null);
                        setImageUri(null);
                        setEditedContact(null);
                    }}>
                        <MaterialCommunityIcons name="refresh" size={20} color="#007AFF" />
                        <Text style={styles.rescanBtnText}>Rescan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={saveToContacts}>
                        <LinearGradient
                            colors={['#30D158', '#248A3D']}
                            style={styles.saveBtnGradient}
                        >
                            <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>Save to Contacts</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// =====================================================
// CONTACT FIELD COMPONENT
// =====================================================

interface ContactFieldProps {
    icon: string;
    label: string;
    value: string;
    editable?: boolean;
    onChangeText?: (text: string) => void;
    multiline?: boolean;
}

function ContactField({ icon, label, value, editable, onChangeText, multiline }: ContactFieldProps) {
    if (!value && !editable) return null;

    return (
        <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
                <MaterialCommunityIcons name={icon as any} size={20} color="#8E8E93" />
            </View>
            <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {editable ? (
                    <TextInput
                        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
                        value={value}
                        onChangeText={onChangeText}
                        multiline={multiline}
                        placeholderTextColor="#6C6C70"
                        placeholder={`Enter ${label.toLowerCase()}`}
                    />
                ) : (
                    <Text style={styles.fieldValue}>{value}</Text>
                )}
            </View>
        </View>
    );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    headerBtn: {
        padding: 8,
        minWidth: 60,
    },
    headerBtnText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    cardPreview: {
        width: '100%',
        aspectRatio: 1.75,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderText: {
        fontSize: 16,
        color: '#8E8E93',
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    processingText: {
        fontSize: 14,
        color: '#fff',
    },
    scanButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    scanBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    scanBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    scanBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    contactContainer: {
        marginTop: 8,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 24,
    },
    quickActionBtn: {
        alignItems: 'center',
        gap: 6,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: {
        fontSize: 12,
        color: '#8E8E93',
    },
    disabled: {
        opacity: 0.4,
    },
    fieldsContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        overflow: 'hidden',
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#3A3A3C',
    },
    fieldIcon: {
        width: 32,
        alignItems: 'center',
        marginTop: 2,
    },
    fieldContent: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 16,
        color: '#fff',
    },
    fieldInput: {
        fontSize: 16,
        color: '#fff',
        padding: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#007AFF',
        paddingBottom: 4,
    },
    fieldInputMultiline: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    confidenceContainer: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
    },
    confidenceLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 8,
    },
    confidenceBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3A3A3C',
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
        backgroundColor: '#30D158',
        borderRadius: 3,
    },
    confidenceValue: {
        fontSize: 14,
        color: '#30D158',
        marginTop: 8,
        textAlign: 'right',
    },
    bottomActions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        backgroundColor: '#1C1C1E',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#3A3A3C',
    },
    rescanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    rescanBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    saveBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    saveBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
