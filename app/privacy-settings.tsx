
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Alert, Switch } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

type ProfileVisibility = 'public' | 'private';
type MessagePermission = 'anyone' | 'mutual_friends' | 'friends_only';
type ServicesVisibility = 'everyone' | 'friends_only' | 'only_me';
type FriendsListVisibility = 'everyone' | 'friends_only' | 'only_me';
type TagPermission = 'anyone' | 'friends_only' | 'no_one';
type CommentPermission = 'anyone' | 'friends_only' | 'no_one';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [messagePermission, setMessagePermission] = useState<MessagePermission>('anyone');
  const [servicesVisibility, setServicesVisibility] = useState<ServicesVisibility>('everyone');
  const [friendsListVisibility, setFriendsListVisibility] = useState<FriendsListVisibility>('everyone');
  const [tagPermission, setTagPermission] = useState<TagPermission>('anyone');
  const [commentPermission, setCommentPermission] = useState<CommentPermission>('anyone');

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    console.log('PrivacySettings: Loading privacy settings');
    try {
      // Note: Backend endpoint not yet implemented
      // When implemented, use: GET /api/settings/privacy or GET /api/users/me/privacy
      // Expected response: { profileVisibility, messagePermission, servicesVisibility, friendsListVisibility, tagPermission, commentPermission }
      // For now, using default values set in state
    } catch (error) {
      console.error('PrivacySettings: Error loading settings:', error);
    }
  };

  const updatePrivacySetting = async (setting: string, value: string) => {
    console.log(`PrivacySettings: Updating ${setting} to ${value}`);
    try {
      // Note: Backend endpoint not yet implemented
      // When implemented, use: PUT /api/settings/privacy or PUT /api/users/me/privacy
      // Body: { setting: string, value: string } or { [setting]: value }
      // Expected response: { success: boolean }
      // For now, settings are only stored locally in component state
      console.log('PrivacySettings: Setting updated locally (backend integration pending)');
    } catch (error) {
      console.error('PrivacySettings: Error updating setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleProfileVisibilityToggle = (value: boolean) => {
    console.log('PrivacySettings: User toggled Profile Visibility');
    const newValue: ProfileVisibility = value ? 'public' : 'private';
    setProfileVisibility(newValue);
    updatePrivacySetting('profileVisibility', newValue);
  };

  const handleMessagePermissionToggle = (value: boolean) => {
    console.log('PrivacySettings: User toggled Message Permission');
    const newValue: MessagePermission = value ? 'anyone' : 'friends_only';
    setMessagePermission(newValue);
    updatePrivacySetting('messagePermission', newValue);
  };

  const handleServicesVisibilityToggle = (value: boolean) => {
    console.log('PrivacySettings: User toggled Services Visibility');
    const newValue: ServicesVisibility = value ? 'everyone' : 'only_me';
    setServicesVisibility(newValue);
    updatePrivacySetting('servicesVisibility', newValue);
  };

  const handleFriendsListVisibilityToggle = (value: boolean) => {
    console.log('PrivacySettings: User toggled Friends List Visibility');
    const newValue: FriendsListVisibility = value ? 'everyone' : 'only_me';
    setFriendsListVisibility(newValue);
    updatePrivacySetting('friendsListVisibility', newValue);
  };

  const handleTagPermissionToggle = (value: boolean) => {
    console.log('PrivacySettings: User toggled Tag Permission');
    const newValue: TagPermission = value ? 'anyone' : 'no_one';
    setTagPermission(newValue);
    updatePrivacySetting('tagPermission', newValue);
  };

  const handleCommentPermissionToggle = (value: boolean) => {
    console.log('PrivacySettings: User toggled Comment Permission');
    const newValue: CommentPermission = value ? 'anyone' : 'no_one';
    setCommentPermission(newValue);
    updatePrivacySetting('commentPermission', newValue);
  };

  const handleBlockedUsersPress = () => {
    console.log('PrivacySettings: User tapped Blocked Users');
    router.push('/blocked-users');
  };

  const privacySettingsTitle = 'Privacy Settings';
  const profileVisibilityLabel = 'Public Profile';
  const profileVisibilityDesc = 'Allow anyone to see your profile';
  const messagePermissionLabel = 'Allow Messages from Anyone';
  const messagePermissionDesc = 'Let anyone send you messages';
  const servicesVisibilityLabel = 'Show Services to Everyone';
  const servicesVisibilityDesc = 'Make your services visible to all users';
  const friendsListVisibilityLabel = 'Show Friends List to Everyone';
  const friendsListVisibilityDesc = 'Make your friends list public';
  const tagPermissionLabel = 'Allow Anyone to Tag Me';
  const tagPermissionDesc = 'Let anyone tag you in posts';
  const commentPermissionLabel = 'Allow Anyone to Comment';
  const commentPermissionDesc = 'Let anyone comment on your posts';
  const blockedUsersLabel = 'Blocked Users';
  const blockedUsersDesc = 'Manage users you have blocked';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{profileVisibilityLabel}</Text>
              <Text style={styles.settingDesc}>{profileVisibilityDesc}</Text>
            </View>
            <Switch
              value={profileVisibility === 'public'}
              onValueChange={handleProfileVisibilityToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{messagePermissionLabel}</Text>
              <Text style={styles.settingDesc}>{messagePermissionDesc}</Text>
            </View>
            <Switch
              value={messagePermission === 'anyone'}
              onValueChange={handleMessagePermissionToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{servicesVisibilityLabel}</Text>
              <Text style={styles.settingDesc}>{servicesVisibilityDesc}</Text>
            </View>
            <Switch
              value={servicesVisibility === 'everyone'}
              onValueChange={handleServicesVisibilityToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{friendsListVisibilityLabel}</Text>
              <Text style={styles.settingDesc}>{friendsListVisibilityDesc}</Text>
            </View>
            <Switch
              value={friendsListVisibility === 'everyone'}
              onValueChange={handleFriendsListVisibilityToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{tagPermissionLabel}</Text>
              <Text style={styles.settingDesc}>{tagPermissionDesc}</Text>
            </View>
            <Switch
              value={tagPermission === 'anyone'}
              onValueChange={handleTagPermissionToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{commentPermissionLabel}</Text>
              <Text style={styles.settingDesc}>{commentPermissionDesc}</Text>
            </View>
            <Switch
              value={commentPermission === 'anyone'}
              onValueChange={handleCommentPermissionToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.blockedSection}>
          <TouchableOpacity style={styles.blockedUsersItem} onPress={handleBlockedUsersPress} activeOpacity={0.7}>
            <View style={styles.blockedLeft}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="hand.raised.fill" 
                  android_material_icon_name="block" 
                  size={22} 
                  color="#FF3B30" 
                />
              </View>
              <View style={styles.blockedContent}>
                <Text style={styles.blockedLabel}>{blockedUsersLabel}</Text>
                <Text style={styles.blockedDesc}>{blockedUsersDesc}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  blockedSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  blockedUsersItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  blockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blockedContent: {
    flex: 1,
  },
  blockedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  blockedDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
});
