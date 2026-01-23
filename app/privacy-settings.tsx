
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Alert, Switch } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedGet, authenticatedPut } from "@/utils/api";

type ProfileVisibility = 'public' | 'private';
type MessagePermission = 'anyone' | 'mutual_friends' | 'friends_only';
type ServicesVisibility = 'everyone' | 'friends_only' | 'only_me';
type FriendsListVisibility = 'everyone' | 'friends_only' | 'only_me';
type TagPermission = 'anyone' | 'friends_only' | 'no_one';
type CommentPermission = 'anyone' | 'friends_only' | 'no_one';

interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  messagePermission: MessagePermission;
  servicesVisibility: ServicesVisibility;
  friendsListVisibility: FriendsListVisibility;
  tagPermission: TagPermission;
  commentPermission: CommentPermission;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [messagePermission, setMessagePermission] = useState<MessagePermission>('anyone');
  const [servicesVisibility, setServicesVisibility] = useState<ServicesVisibility>('everyone');
  const [friendsListVisibility, setFriendsListVisibility] = useState<FriendsListVisibility>('everyone');
  const [tagPermission, setTagPermission] = useState<TagPermission>('anyone');
  const [commentPermission, setCommentPermission] = useState<CommentPermission>('anyone');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    console.log('PrivacySettings: Loading privacy settings from backend');
    try {
      const response = await authenticatedGet<PrivacySettings>('/api/settings/privacy');
      console.log('PrivacySettings: Loaded settings:', response);
      
      setProfileVisibility(response.profileVisibility);
      setMessagePermission(response.messagePermission);
      setServicesVisibility(response.servicesVisibility);
      setFriendsListVisibility(response.friendsListVisibility);
      setTagPermission(response.tagPermission);
      setCommentPermission(response.commentPermission);
    } catch (error) {
      console.error('PrivacySettings: Error loading settings:', error);
      Alert.alert('Error', 'Failed to load privacy settings. Using defaults.');
    }
  };

  const updatePrivacySetting = async (settingKey: keyof PrivacySettings, value: string) => {
    console.log(`PrivacySettings: Updating ${settingKey} to ${value}`);
    
    if (loading) {
      console.log('PrivacySettings: Update already in progress, skipping');
      return;
    }
    
    setLoading(true);
    
    try {
      const updateData = { [settingKey]: value };
      const response = await authenticatedPut<{ success: boolean; settings: PrivacySettings }>('/api/settings/privacy', updateData);
      
      console.log('PrivacySettings: Setting updated successfully:', response);
      
      if (response.success && response.settings) {
        setProfileVisibility(response.settings.profileVisibility);
        setMessagePermission(response.settings.messagePermission);
        setServicesVisibility(response.settings.servicesVisibility);
        setFriendsListVisibility(response.settings.friendsListVisibility);
        setTagPermission(response.settings.tagPermission);
        setCommentPermission(response.settings.commentPermission);
      }
    } catch (error) {
      console.error('PrivacySettings: Error updating setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting. Please try again.');
      await loadPrivacySettings();
    } finally {
      setLoading(false);
    }
  };

  const handleProfileVisibilityToggle = async (value: boolean) => {
    console.log('PrivacySettings: User toggled Profile Visibility');
    const newValue: ProfileVisibility = value ? 'public' : 'private';
    setProfileVisibility(newValue);
    await updatePrivacySetting('profileVisibility', newValue);
  };

  const handleMessagePermissionToggle = async (value: boolean) => {
    console.log('PrivacySettings: User toggled Message Permission');
    const newValue: MessagePermission = value ? 'anyone' : 'friends_only';
    setMessagePermission(newValue);
    await updatePrivacySetting('messagePermission', newValue);
  };

  const handleServicesVisibilityToggle = async (value: boolean) => {
    console.log('PrivacySettings: User toggled Services Visibility');
    const newValue: ServicesVisibility = value ? 'everyone' : 'only_me';
    setServicesVisibility(newValue);
    await updatePrivacySetting('servicesVisibility', newValue);
  };

  const handleFriendsListVisibilityToggle = async (value: boolean) => {
    console.log('PrivacySettings: User toggled Friends List Visibility');
    const newValue: FriendsListVisibility = value ? 'everyone' : 'only_me';
    setFriendsListVisibility(newValue);
    await updatePrivacySetting('friendsListVisibility', newValue);
  };

  const handleTagPermissionToggle = async (value: boolean) => {
    console.log('PrivacySettings: User toggled Tag Permission');
    const newValue: TagPermission = value ? 'anyone' : 'no_one';
    setTagPermission(newValue);
    await updatePrivacySetting('tagPermission', newValue);
  };

  const handleCommentPermissionToggle = async (value: boolean) => {
    console.log('PrivacySettings: User toggled Comment Permission');
    const newValue: CommentPermission = value ? 'anyone' : 'no_one';
    setCommentPermission(newValue);
    await updatePrivacySetting('commentPermission', newValue);
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
