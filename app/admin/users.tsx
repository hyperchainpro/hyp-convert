import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, Modal, ScrollView, Image } from 'react-native';
import { Text, Surface, Avatar, ActivityIndicator, Button, IconButton, TextInput, Divider, Chip } from 'react-native-paper';
import { UserStat, getAllUsers } from '@/lib/admin';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface ExtendedUserStat extends UserStat {
    role?: string;
    last_ip?: string;
    email?: string;
}

export default function UsersManager() {
    const [users, setUsers] = useState<ExtendedUserStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ExtendedUserStat | null>(null);
    const [editTokens, setEditTokens] = useState('');
    const [editRole, setEditRole] = useState('user');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Updated select to handle schema changes
            const { data: profilesData, error } = await supabase
                .from('profiles')
                .select('id, username, hyp_tokens, created_at, role, last_ip')
                .order('created_at', { ascending: false });

            if (error) {
                // Fallback to updated_at if created_at fails
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('profiles')
                    .select('id, username, hyp_tokens, role, updated_at')
                    .order('updated_at', { ascending: false });

                if (fallbackError) throw fallbackError;

                const mappedData = fallbackData?.map(p => ({
                    ...p,
                    created_at: p.updated_at
                })) || [];
                setUsers(mappedData as ExtendedUserStat[]);
            } else {
                setUsers(profilesData as ExtendedUserStat[]);
            }

            // Note: email fetching normally requires admin privileges or specific setup
            // This part might fail on client-side, so we catch it separately
            try {
                const { data: authData } = await supabase.auth.admin.listUsers();
                if (authData?.users) {
                    setUsers((prev: ExtendedUserStat[]) => prev.map((u: ExtendedUserStat) => {
                        const authUser = authData.users.find(au => au.id === u.id);
                        return authUser ? { ...u, email: authUser.email } : u;
                    }));
                }
            } catch (authErr) {
                console.warn('Auth admin list failed (typical on client)', authErr);
            }

        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load users. Ensure you have admin permissions.');
        }
        setLoading(false);
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.includes(searchQuery)
    );

    const handleEdit = (user: ExtendedUserStat) => {
        setSelectedUser(user);
        setEditTokens(String(user.hyp_tokens || 0));
        setEditRole(user.role || 'user');
        setEditModalVisible(true);
    };

    const handleSave = async () => {
        if (!selectedUser) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    hyp_tokens: parseInt(editTokens) || 0,
                    role: editRole,
                })
                .eq('id', selectedUser.id);

            if (error) throw error;

            Alert.alert('Success', 'User updated successfully');
            setEditModalVisible(false);
            loadData();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update user');
        }
    };

    const handleDelete = (user: ExtendedUserStat) => {
        Alert.alert(
            'Confirm Delete',
            `Delete user "${user.username}"? This will remove all their data.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.auth.admin.deleteUser(user.id);
                            if (error) {
                                console.error('Delete error:', error);
                                Alert.alert(
                                    'Permission Denied',
                                    'Gagal menghapus akun auth. Kemungkinan karena batasan Client-side. \n\nTips: Gunakan Supabase Dashboard atau implementasikan Edge Function untuk menghapus user secara permanen.'
                                );
                                return;
                            }

                            Alert.alert('Success', 'User deleted');
                            loadData();
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: ExtendedUserStat }) => (
        <Surface style={styles.userRow}>
            <Avatar.Text
                size={40}
                label={item.username?.substring(0, 2).toUpperCase() || 'U'}
                style={{ backgroundColor: item.role === 'admin' ? '#5856D6' : '#007AFF' }}
            />
            <View style={styles.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.username}>{item.username || 'Anonymous'}</Text>
                    {item.role === 'admin' && (
                        <Chip icon="shield-check" compact style={{ backgroundColor: '#5856D6', height: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 10 }}>ADMIN</Text>
                        </Chip>
                    )}
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.date}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
                {item.last_ip && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <MaterialCommunityIcons name="ip" size={12} color="#8E8E93" />
                        <Text style={styles.ip}> {item.last_ip}</Text>
                    </View>
                )}
            </View>
            <View style={styles.tokenInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Image
                        source={require('@/assets/images/hyp-logo-auth.png')}
                        style={{ width: 16, height: 16 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.tokenValue}> {item.hyp_tokens || 0}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    <IconButton
                        icon="pencil"
                        size={16}
                        iconColor="#007AFF"
                        containerColor="#1C1C1E"
                        onPress={() => handleEdit(item)}
                    />
                    <IconButton
                        icon="delete"
                        size={16}
                        iconColor="#FF3B30"
                        containerColor="#1C1C1E"
                        onPress={() => handleDelete(item)}
                    />
                </View>
            </View>
        </Surface>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Button
                        icon="arrow-left"
                        mode="text"
                        textColor="#fff"
                        onPress={() => router.back()}
                        compact
                    >
                        Back
                    </Button>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>User Management</Text>
                </View>
                <Chip icon="account-group" style={{ backgroundColor: '#1C1C1E' }}>
                    <Text style={{ color: '#fff' }}>{filteredUsers.length} Users</Text>
                </Chip>
            </View>

            <TextInput
                mode="outlined"
                placeholder="Search by username, email, or ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                left={<TextInput.Icon icon="magnify" color="#8E8E93" />}
                style={{ marginBottom: 16, backgroundColor: '#1C1C1E' }}
                textColor="#fff"
                theme={{ colors: { onSurfaceVariant: '#8E8E93' } }}
            />

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshing={refreshing}
                onRefresh={async () => {
                    setRefreshing(true);
                    await loadData();
                    setRefreshing(false);
                }}
            />

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Surface style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit User</Text>
                            <IconButton
                                icon="close"
                                size={20}
                                onPress={() => setEditModalVisible(false)}
                            />
                        </View>
                        <Divider />
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.label}>Username</Text>
                            <Text style={styles.value}>{selectedUser?.username}</Text>

                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{selectedUser?.email}</Text>

                            <Text style={styles.label}>HYP Tokens</Text>
                            <TextInput
                                mode="outlined"
                                value={editTokens}
                                onChangeText={setEditTokens}
                                keyboardType="numeric"
                                style={styles.input}
                            />

                            <Text style={styles.label}>Role</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Button
                                    mode={editRole === 'user' ? 'contained' : 'outlined'}
                                    onPress={() => setEditRole('user')}
                                    style={{ flex: 1 }}
                                >
                                    User
                                </Button>
                                <Button
                                    mode={editRole === 'admin' ? 'contained' : 'outlined'}
                                    onPress={() => setEditRole('admin')}
                                    buttonColor="#5856D6"
                                    style={{ flex: 1 }}
                                >
                                    Admin
                                </Button>
                            </View>
                        </ScrollView>
                        <Divider />
                        <View style={styles.modalFooter}>
                            <Button mode="outlined" onPress={() => setEditModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={handleSave}>
                                Save Changes
                            </Button>
                        </View>
                    </Surface>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1C1C1E',
        marginBottom: 8,
        borderRadius: 12
    },
    userInfo: { flex: 1, marginLeft: 12 },
    username: { color: '#fff', fontSize: 16, fontWeight: '600' },
    email: { color: '#8E8E93', fontSize: 13, marginTop: 2 },
    date: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
    ip: { color: '#8E8E93', fontSize: 11, fontFamily: 'monospace' },
    tokenInfo: { alignItems: 'flex-end' },
    tokenValue: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalBody: {
        padding: 16,
    },
    label: {
        color: '#8E8E93',
        fontSize: 14,
        marginTop: 16,
        marginBottom: 4,
    },
    value: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2C2C2E',
        marginBottom: 8,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        gap: 8,
    },
});
