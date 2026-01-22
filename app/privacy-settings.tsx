
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Alert } from "react-native";
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
      // TODO: Backend Integration - GET /api/settings/privacy
      // Returns: { profileVisibility, messagePermission, servicesVisibility, friendsListVisibility, tagPermission, commentPermission }
    } catch (error) {
      console.error('PrivacySettings: Error loading settings:', error);
    }
  };

  const updatePrivacySetting = async (setting: string, value: string) => {
    console.log(`PrivacySettings: Updating ${setting} to ${value}`);
    try {
      // TODO: Backend Integration - PUT /api/settings/privacy
      // Body: { setting: string, value: string }
      // Returns: { success: boolean }
    } catch (error) {
      console.error('PrivacySettings: Error updating setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleProfileVisibilityPress = () => {
    console.log('PrivacySettings: User tapped Profile Visibility');
    const options = ['Public', 'Private'];
    const values: ProfileVisibility[] = ['public', 'private'];
    
    Alert.alert(
      'Profile Visibility',
      'Choose who can see your profile',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: () => {
            const newValue = values[index];
            setProfileVisibility(newValue);
            updatePrivacySetting('profileVisibility', newValue);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMessagePermissionPress = () => {
    console.log('PrivacySettings: User tapped Message Permission');
    const options = ['Anyone', 'Mutual Friends', 'Friends Only'];
    const values: MessagePermission[] = ['anyone', 'mutual_friends', 'friends_only'];
    
    Alert.alert(
      'Who Can Message Me',
      'Choose who can send you messages',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: () => {
            const newValue = values[index];
            setMessagePermission(newValue);
            updatePrivacySetting('messagePermission', newValue);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleServicesVisibilityPress = () => {
    console.log('PrivacySettings: User tapped Services Visibility');
    const options = ['Everyone', 'Friends Only', 'Only Me'];
    const values: ServicesVisibility[] = ['everyone', 'friends_only', 'only_me'];
    
    Alert.alert(
      'Who Can See My Services',
      'Choose who can see your services',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: () => {
            const newValue = values[index];
            setServicesVisibility(newValue);
            updatePrivacySetting('servicesVisibility', newValue);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleFriendsListVisibilityPress = () => {
    console.log('PrivacySettings: User tapped Friends List Visibility');
    const options = ['Everyone', 'Friends Only', 'Only Me'];
    const values: FriendsListVisibility[] = ['everyone', 'friends_only', 'only_me'];
    
    Alert.alert(
      'Who Can See My Friends List',
      'Choose who can see your friends list',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: () => {
            const newValue = values[index];
            setFriendsListVisibility(newValue);
            updatePrivacySetting('friendsListVisibility', newValue);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTagPermissionPress = () => {
    console.log('PrivacySettings: User tapped Tag Permission');
    const options = ['Anyone', 'Friends Only', 'No One'];
    const values: TagPermission[] = ['anyone', 'friends_only', 'no_one'];
    
    Alert.alert(
      'Who Can Tag Me',
      'Choose who can tag you in posts',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: () => {
            const newValue = values[index];
            setTagPermission(newValue);
            updatePrivacySetting('tagPermission', newValue);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCommentPermissionPress = () => {
    console.log('PrivacySettings: User tapped Comment Permission');
    const options = ['Anyone', 'Friends Only', 'No One'];
    const values: CommentPermission[] = ['anyone', 'friends_only', 'no_one'];
    
    Alert.alert(
      'Who Can Comment on My Posts',
      'Choose who can comment on your posts',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: () => {
            const newValue = values[index];
            setCommentPermission(newValue);
            updatePrivacySetting('commentPermission', newValue);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleBlockedUsersPress = () => {
    console.log('PrivacySettings: User tapped Blocked Users');
    router.push('/blocked-users');
  };

  const getProfileVisibilityText = () => {
    return profileVisibility === 'public' ? 'Public' : 'Private';
  };

  const getMessagePermissionText = () => {
    const textMap: Record<MessagePermission, string> = {
      anyone: 'Anyone',
      mutual_friends: 'Mutual Friends',
      friends_only: 'Friends Only',
    };
    return textMap[messagePermission];
  };

  const getServicesVisibilityText = () => {
    const textMap: Record<ServicesVisibility, string> = {
      everyone: 'Everyone',
      friends_only: 'Friends Only',
      only_me: 'Only Me',
    };
    return textMap[servicesVisibility];
  };

  const getFriendsListVisibilityText = () => {
    const textMap: Record<FriendsListVisibility, string> = {
      everyone: 'Everyone',
      friends_only: 'Friends Only',
      only_me: 'Only Me',
    };
    return textMap[friendsListVisibility];
  };

  const getTagPermissionText = () => {
    const textMap: Record<TagPermission, string> = {
      anyone: 'Anyone',
      friends_only: 'Friends Only',
      no_one: 'No One',
    };
    return textMap[tagPermission];
  };

  const getCommentPermissionText = () => {
    const textMap: Record<CommentPermission, string> = {
      anyone: 'Anyone',
      friends_only: 'Friends Only',
      no_one: 'No One',
    };
    return textMap[commentPermission];
  };

  const privacySettingsTitle = 'Privacy Settings';
  const profileVisibilityLabel = 'Profile Visibility';
  const messagePermissionLabel = 'Who Can Message Me';
  const servicesVisibilityLabel = 'Who Can See My Services';
  const friendsListVisibilityLabel = 'Who Can See My Friends List';
  const tagPermissionLabel = 'Who Can Tag Me';
  const commentPermissionLabel = 'Who Can Comment on My Posts';
  const blockedUsersLabel = 'Blocked Users';
  const blockedUsersDesc = 'Manage users you have blocked';

  const profileVisibilityValue = getProfileVisibilityText();
  const messagePermissionValue = getMessagePermissionText();
  const servicesVisibilityValue = getServicesVisibilityText();
  const friendsListVisibilityValue = getFriendsListVisibilityText();
  const tagPermissionValue = getTagPermissionText();
  const commentPermissionValue = getCommentPermissionText();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem} onPress={handleProfileVisibilityPress} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{profileVisibilityLabel}</Text>
              <Text style={styles.settingValue}>{profileVisibilityValue}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleMessagePermissionPress} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{messagePermissionLabel}</Text>
              <Text style={styles.settingValue}>{messagePermissionValue}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleServicesVisibilityPress} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{servicesVisibilityLabel}</Text>
              <Text style={styles.settingValue}>{servicesVisibilityValue}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleFriendsListVisibilityPress} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{friendsListVisibilityLabel}</Text>
              <Text style={styles.settingValue}>{friendsListVisibilityValue}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleTagPermissionPress} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{tagPermissionLabel}</Text>
              <Text style={styles.settingValue}>{tagPermissionValue}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleCommentPermissionPress} activeOpacity={0.7}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{commentPermissionLabel}</Text>
              <Text style={styles.settingValue}>{commentPermissionValue}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
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
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
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
