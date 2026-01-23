
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, ImageSourcePropType, Image } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedGet, authenticatedDelete } from "@/utils/api";

interface BlockedUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  blockedAt: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    console.log('BlockedUsers: Loading blocked users');
    try {
      const response = await authenticatedGet<BlockedUser[]>('/api/settings/blocked-users');
      console.log('BlockedUsers: Loaded blocked users:', response);
      setBlockedUsers(response);
      setLoading(false);
    } catch (error) {
      console.error('BlockedUsers: Error loading blocked users:', error);
      setBlockedUsers([]);
      setLoading(false);
    }
  };

  const handleUnblockUser = (userId: string, username: string) => {
    console.log('BlockedUsers: User tapped unblock for:', username);
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          onPress: async () => {
            console.log('BlockedUsers: Unblocking user:', userId);
            try {
              await authenticatedDelete(`/api/settings/blocked-users/${userId}`);
              console.log('BlockedUsers: User unblocked successfully');
              setBlockedUsers(prev => prev.filter(user => user.id !== userId));
              Alert.alert('Success', `${username} has been unblocked`);
            } catch (error) {
              console.error('BlockedUsers: Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names[1]?.[0] || '';
    const initials = firstInitial + lastInitial;
    return initials.toUpperCase();
  };

  const blockedUsersTitle = 'Blocked Users';
  const emptyStateTitle = 'No Blocked Users';
  const emptyStateMessage = 'You have not blocked any users';
  const unblockButtonText = 'Unblock';
  const loadingText = 'Loading...';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Blocked Users',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{loadingText}</Text>
          </View>
        ) : blockedUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol 
              ios_icon_name="hand.raised.fill" 
              android_material_icon_name="block" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyStateTitle}>{emptyStateTitle}</Text>
            <Text style={styles.emptyStateMessage}>{emptyStateMessage}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            {blockedUsers.map((user, index) => {
              const userInitials = getInitials(user.fullName);
              
              return (
                <View key={index} style={styles.userItem}>
                  <View style={styles.userLeft}>
                    {user.avatarUrl ? (
                      <Image 
                        source={resolveImageSource(user.avatarUrl)} 
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{userInitials}</Text>
                      </View>
                    )}
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.fullName}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.unblockButton}
                    onPress={() => handleUnblockUser(user.id, user.username)}
                  >
                    <Text style={styles.unblockButtonText}>{unblockButtonText}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unblockButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 40,
  },
});
