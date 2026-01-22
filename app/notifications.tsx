
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, ImageSourcePropType } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  relatedUserId?: string;
  relatedUsername?: string;
  relatedUserAvatar?: string;
  relatedUserFullName?: string;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('NotificationsScreen: Loading notifications');
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      console.log('NotificationsScreen: Fetching notifications from backend');
      const response = await fetch(`${BACKEND_URL}/api/notifications/detailed`);
      const data = await response.json();
      console.log('NotificationsScreen: Notifications loaded successfully', data);
      setNotifications(data);
    } catch (error) {
      console.error('NotificationsScreen: Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    console.log('NotificationsScreen: User tapped notification:', notification.id);
    
    try {
      await fetch(`${BACKEND_URL}/api/notifications/${notification.id}/read`, {
        method: 'PUT',
        body: JSON.stringify({})
      });
      loadNotifications();
    } catch (error) {
      console.error('NotificationsScreen: Error marking notification as read:', error);
    }

    if (notification.type === 'friend_request' && notification.relatedUserId) {
      console.log('NotificationsScreen: Navigating to friend request');
    } else if (notification.type === 'post_like' || notification.type === 'post_comment' || notification.type === 'post_repost') {
      console.log('NotificationsScreen: Navigating to post');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return { ios: 'person.badge.plus', android: 'person-add' };
      case 'post_like':
        return { ios: 'heart.fill', android: 'favorite' };
      case 'post_comment':
        return { ios: 'bubble.left', android: 'chat-bubble' };
      case 'post_repost':
        return { ios: 'arrow.2.squarepath', android: 'repeat' };
      case 'contact_suggestion':
        return { ios: 'person.crop.circle.badge.plus', android: 'person-add' };
      default:
        return { ios: 'bell.fill', android: 'notifications' };
    }
  };

  const noNotificationsText = 'No notifications yet';
  const allCaughtUpText = "You're all caught up!";

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="bell.slash"
                android_material_icon_name="notifications-off"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>{noNotificationsText}</Text>
              <Text style={styles.emptyStateSubtext}>{allCaughtUpText}</Text>
            </View>
          ) : (
            <React.Fragment>
              {notifications.map((notification, index) => {
                const icon = getNotificationIcon(notification.type);
                const initials = notification.relatedUserFullName
                  ? getInitials(notification.relatedUserFullName)
                  : '?';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationIconContainer}>
                        {notification.relatedUserAvatar ? (
                          <Image
                            source={resolveImageSource(notification.relatedUserAvatar)}
                            style={styles.notificationAvatar}
                          />
                        ) : (
                          <View style={styles.notificationAvatarPlaceholder}>
                            <Text style={styles.notificationAvatarText}>{initials}</Text>
                          </View>
                        )}
                        <View style={styles.notificationIconBadge}>
                          <IconSymbol
                            ios_icon_name={icon.ios}
                            android_material_icon_name={icon.android}
                            size={12}
                            color={colors.background}
                          />
                        </View>
                      </View>
                      <View style={styles.notificationDetails}>
                        <Text style={styles.notificationText}>{notification.content}</Text>
                        <Text style={styles.notificationTime}>{notification.createdAt}</Text>
                      </View>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
  },
  notificationCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  notificationAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  notificationIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundAlt,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
