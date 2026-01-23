
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Switch, Platform, Alert } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { authenticatedGet, authenticatedPut } from "@/utils/api";

interface NotificationSettings {
  friendRequests: boolean;
  messages: boolean;
  activityUpdates: boolean;
}

interface PushStatus {
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const [friendRequests, setFriendRequests] = useState(true);
  const [messages, setMessages] = useState(true);
  const [activityUpdates, setActivityUpdates] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
    checkPushNotificationStatus();
  }, []);

  const loadNotificationSettings = async () => {
    console.log('NotificationSettings: Loading notification preferences');
    try {
      const response = await authenticatedGet<NotificationSettings>('/api/settings/notifications');
      console.log('NotificationSettings: Loaded settings:', response);
      setFriendRequests(response.friendRequests);
      setMessages(response.messages);
      setActivityUpdates(response.activityUpdates);
      setLoading(false);
    } catch (error) {
      console.error('NotificationSettings: Error loading settings:', error);
      setLoading(false);
    }
  };

  const checkPushNotificationStatus = async () => {
    console.log('NotificationSettings: Checking push notification status');
    try {
      const response = await authenticatedGet<PushStatus>('/api/settings/push-status');
      console.log('NotificationSettings: Push status:', response);
      setPushEnabled(response.enabled);
    } catch (error) {
      console.error('NotificationSettings: Error checking push status:', error);
    }
  };

  const updateSetting = async (setting: string, value: boolean) => {
    console.log(`NotificationSettings: Updating ${setting} to ${value}`);
    try {
      await authenticatedPut('/api/settings/notifications', { setting, value });
      console.log('NotificationSettings: Setting updated successfully');
    } catch (error) {
      console.error('NotificationSettings: Error updating setting:', error);
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };

  const handleFriendRequestsToggle = (value: boolean) => {
    console.log('NotificationSettings: User toggled friend requests:', value);
    setFriendRequests(value);
    updateSetting('friendRequests', value);
  };

  const handleMessagesToggle = (value: boolean) => {
    console.log('NotificationSettings: User toggled messages:', value);
    setMessages(value);
    updateSetting('messages', value);
  };

  const handleActivityUpdatesToggle = (value: boolean) => {
    console.log('NotificationSettings: User toggled activity updates:', value);
    setActivityUpdates(value);
    updateSetting('activityUpdates', value);
  };

  const notificationSettingsTitle = 'Notification Settings';
  const friendRequestsLabel = 'Friend Requests';
  const friendRequestsDesc = 'Get notified when someone sends you a friend request';
  const messagesLabel = 'Messages';
  const messagesDesc = 'Get notified when you receive new messages';
  const activityUpdatesLabel = 'Activity Updates';
  const activityUpdatesDesc = 'Get notified about likes and comments on your posts';
  const pushStatusLabel = 'Push Notifications Status';
  const pushEnabledText = 'Push notifications are enabled';
  const pushDisabledText = 'Push notifications are disabled';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{friendRequestsLabel}</Text>
              <Text style={styles.settingDescription}>{friendRequestsDesc}</Text>
            </View>
            <Switch
              value={friendRequests}
              onValueChange={handleFriendRequestsToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{messagesLabel}</Text>
              <Text style={styles.settingDescription}>{messagesDesc}</Text>
            </View>
            <Switch
              value={messages}
              onValueChange={handleMessagesToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{activityUpdatesLabel}</Text>
              <Text style={styles.settingDescription}>{activityUpdatesDesc}</Text>
            </View>
            <Switch
              value={activityUpdates}
              onValueChange={handleActivityUpdatesToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>{pushStatusLabel}</Text>
          <View style={styles.statusCard}>
            <Text style={[styles.statusText, pushEnabled ? styles.statusEnabled : styles.statusDisabled]}>
              {pushEnabled ? pushEnabledText : pushDisabledText}
            </Text>
          </View>
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
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statusSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statusCard: {
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusEnabled: {
    color: colors.primary,
  },
  statusDisabled: {
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 40,
  },
});
