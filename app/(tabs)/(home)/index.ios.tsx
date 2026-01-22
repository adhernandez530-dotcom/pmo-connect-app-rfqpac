import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";

function resolveImageSource(source: string | number | any): any {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source;
}

interface UserProfile {
  username: string;
  fullName: string;
  location: string;
  bio: string;
  avatarUrl?: string;
  friendsCount: number;
}

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);

  useEffect(() => {
    console.log('HomeScreen: Loading user profile and notifications');
    loadProfile();
    loadNotifications();
  }, []);

  const loadProfile = async () => {
    console.log('HomeScreen: Fetching user profile');
    // TODO: Backend Integration - GET /api/users/me to fetch current user profile
    // Returns: { id, username, fullName, location, bio, avatarUrl }
    // TODO: Backend Integration - GET /api/friends/count to get friends count
    // Returns: { count: number }
    
    // Mock data for now
    setProfile({
      username: 'Al3xtacy',
      fullName: 'Alexander Hernandez',
      location: 'Queens, NY',
      bio: 'A Project Manager by Day, A D.J by night, and a cook between both!',
      friendsCount: 0,
    });
  };

  const loadNotifications = async () => {
    console.log('HomeScreen: Fetching notifications');
    // TODO: Backend Integration - GET /api/notifications to fetch user notifications
    // Returns: [{ id, type, content, read, createdAt }]
    
    // Mock data for now
    setNotifications([]);
  };

  const handleEditProfile = () => {
    console.log('HomeScreen: User tapped Edit Profile button');
    // TODO: Navigate to edit profile screen
  };

  const handleNotificationPress = () => {
    console.log('HomeScreen: User tapped notifications icon');
    setNotificationsExpanded(!notificationsExpanded);
  };

  const handleSettingsPress = () => {
    console.log('HomeScreen: User tapped settings icon');
    // TODO: Navigate to settings screen
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const initials = profile ? getInitials(profile.fullName) : 'A';
  const friendsText = profile ? `${profile.friendsCount} Friends` : '0 Friends';
  const noNotificationsText = 'No new notifications';
  const allCaughtUpText = "You're all caught up!";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Home",
          headerLargeTitle: true,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={handleNotificationPress}>
                <IconSymbol 
                  ios_icon_name="bell.fill" 
                  android_material_icon_name="notifications" 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSettingsPress}>
                <IconSymbol 
                  ios_icon_name="gear" 
                  android_material_icon_name="settings" 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.fullName}>{profile.fullName}</Text>
            
            <View style={styles.locationContainer}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on" 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
            
            <Text style={styles.bio}>{profile.bio}</Text>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <IconSymbol 
                ios_icon_name="pencil" 
                android_material_icon_name="edit" 
                size={18} 
                color={colors.background} 
              />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <View style={styles.friendsButton}>
              <Text style={styles.friendsButtonText}>{friendsText}</Text>
            </View>
          </View>
        )}

        <View style={styles.notificationsCard}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.notificationsTitle}>Notifications</Text>
            <TouchableOpacity onPress={handleNotificationPress}>
              <IconSymbol 
                ios_icon_name={notificationsExpanded ? "chevron.up" : "chevron.down"} 
                android_material_icon_name={notificationsExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          {notificationsExpanded && (
            <View style={styles.notificationsContent}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <IconSymbol 
                    ios_icon_name="bell.slash" 
                    android_material_icon_name="notifications-off" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.emptyNotificationsText}>{noNotificationsText}</Text>
                  <Text style={styles.emptyNotificationsSubtext}>{allCaughtUpText}</Text>
                </View>
              ) : (
                <React.Fragment>
                  {notifications.map((notification, index) => (
                    <View key={index} style={styles.notificationItem}>
                      <Text style={styles.notificationContent}>{notification.content}</Text>
                    </View>
                  ))}
                </React.Fragment>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileCard: {
    backgroundColor: colors.backgroundAlt,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  editButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginBottom: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  friendsButton: {
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  friendsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  notificationsCard: {
    backgroundColor: colors.backgroundAlt,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  notificationsContent: {
    marginTop: 16,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
    fontWeight: '600',
  },
  emptyNotificationsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationContent: {
    fontSize: 14,
    color: colors.text,
  },
});
