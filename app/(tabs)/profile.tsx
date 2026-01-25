
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Image, ImageSourcePropType } from "react-native";
import { authenticatedFetch } from "@/utils/api";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

interface UserProfile {
  username: string;
  fullName: string;
  location: string;
  bio: string;
  avatarUrl?: string;
  friendsCount: number;
}

interface Service {
  id: string;
  serviceName: string;
  createdAt: string;
}

interface Knowledge {
  id: string;
  topic: string;
  createdAt: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log('ProfileScreen: Loading user profile, services, and knowledge');
    loadProfile();
    loadServices();
    loadKnowledge();
    loadUnreadCount();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('ProfileScreen: Fetching user profile');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/users/me`);
      const data = await response.json();
      console.log('ProfileScreen: Profile data received:', data);
      setProfile(data);
    } catch (error) {
      console.error('ProfileScreen: Error loading profile:', error);
    }
  };

  const loadServices = async () => {
    try {
      console.log('ProfileScreen: Fetching user services');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/services`);
      const data = await response.json();
      console.log('ProfileScreen: Services data received:', data);
      setServices(data);
    } catch (error) {
      console.error('ProfileScreen: Error loading services:', error);
    }
  };

  const loadKnowledge = async () => {
    try {
      console.log('ProfileScreen: Fetching user knowledge topics');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/knowledge`);
      const data = await response.json();
      console.log('ProfileScreen: Knowledge data received:', data);
      setKnowledge(data);
    } catch (error) {
      console.error('ProfileScreen: Error loading knowledge:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/notifications/unread-count`);
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('ProfileScreen: Error loading unread count:', error);
    }
  };

  const handleEditProfile = () => {
    console.log('ProfileScreen: User tapped Edit Profile button');
    router.push('/edit-profile');
  };

  const handleNotificationPress = () => {
    console.log('ProfileScreen: User tapped Notifications button');
    router.push('/notifications');
  };

  const handleSettingsPress = () => {
    console.log('ProfileScreen: User tapped Settings button');
    router.push('/settings');
  };

  const handleFriendsPress = () => {
    console.log('ProfileScreen: User tapped Friends button');
    router.push('/(tabs)/friends');
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const initials = getInitials(profile.fullName);
  const friendsCountText = `${profile.friendsCount || 0}`;
  const servicesCountText = `${services.length}`;
  const knowledgeCountText = `${knowledge.length}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}>
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={22}
              color={colors.text}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
            <IconSymbol
              ios_icon_name="gearshape.fill"
              android_material_icon_name="settings"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          {profile.avatarUrl ? (
            <Image source={resolveImageSource(profile.avatarUrl)} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.fullName}>{profile.fullName}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.location && (
            <View style={styles.locationContainer}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
          )}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem} onPress={handleFriendsPress}>
              <Text style={styles.statValue}>{friendsCountText}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{servicesCountText}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{knowledgeCountText}</Text>
              <Text style={styles.statLabel}>Knowledge</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services I Offer</Text>
            <View style={styles.tagsContainer}>
              {services.map((service, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{service.serviceName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {knowledge.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Knowledge Topics</Text>
            <View style={styles.tagsContainer}>
              {knowledge.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item.topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fullName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  editButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.text,
  },
  bottomPadding: {
    height: 100,
  },
});
</write file>

<write file="app/(tabs)/profile.ios.tsx">
import React, { useState, useEffect } from "react";
import { authenticatedFetch } from "@/utils/api";
import { Stack, useRouter } from "expo-router";
import Constants from "expo-constants";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

interface UserProfile {
  username: string;
  fullName: string;
  location: string;
  bio: string;
  avatarUrl?: string;
  friendsCount: number;
}

interface Service {
  id: string;
  serviceName: string;
  createdAt: string;
}

interface Knowledge {
  id: string;
  topic: string;
  createdAt: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log('ProfileScreen: Loading user profile, services, and knowledge');
    loadProfile();
    loadServices();
    loadKnowledge();
    loadUnreadCount();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('ProfileScreen: Fetching user profile');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/users/me`);
      const data = await response.json();
      console.log('ProfileScreen: Profile data received:', data);
      setProfile(data);
    } catch (error) {
      console.error('ProfileScreen: Error loading profile:', error);
    }
  };

  const loadServices = async () => {
    try {
      console.log('ProfileScreen: Fetching user services');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/services`);
      const data = await response.json();
      console.log('ProfileScreen: Services data received:', data);
      setServices(data);
    } catch (error) {
      console.error('ProfileScreen: Error loading services:', error);
    }
  };

  const loadKnowledge = async () => {
    try {
      console.log('ProfileScreen: Fetching user knowledge topics');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/knowledge`);
      const data = await response.json();
      console.log('ProfileScreen: Knowledge data received:', data);
      setKnowledge(data);
    } catch (error) {
      console.error('ProfileScreen: Error loading knowledge:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/notifications/unread-count`);
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('ProfileScreen: Error loading unread count:', error);
    }
  };

  const handleEditProfile = () => {
    console.log('ProfileScreen: User tapped Edit Profile button');
    router.push('/edit-profile');
  };

  const handleNotificationPress = () => {
    console.log('ProfileScreen: User tapped Notifications button');
    router.push('/notifications');
  };

  const handleSettingsPress = () => {
    console.log('ProfileScreen: User tapped Settings button');
    router.push('/settings');
  };

  const handleFriendsPress = () => {
    console.log('ProfileScreen: User tapped Friends button');
    router.push('/(tabs)/friends');
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  if (!profile) {
    const loadingText = 'Loading profile...';
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      </>
    );
  }

  const initials = getInitials(profile.fullName);
  const friendsCountText = `${profile.friendsCount || 0}`;
  const servicesCountText = `${services.length}`;
  const knowledgeCountText = `${knowledge.length}`;
  const editButtonText = 'Edit Profile';
  const servicesTitle = 'Services I Offer';
  const knowledgeTitle = 'Knowledge Topics';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}>
                <IconSymbol
                  ios_icon_name="bell.fill"
                  android_material_icon_name="notifications"
                  size={22}
                  color={colors.text}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
                <IconSymbol
                  ios_icon_name="gearshape.fill"
                  android_material_icon_name="settings"
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          {profile.avatarUrl ? (
            <Image source={resolveImageSource(profile.avatarUrl)} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.fullName}>{profile.fullName}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.location && (
            <View style={styles.locationContainer}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
          )}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem} onPress={handleFriendsPress}>
              <Text style={styles.statValue}>{friendsCountText}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{servicesCountText}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{knowledgeCountText}</Text>
              <Text style={styles.statLabel}>Knowledge</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>{editButtonText}</Text>
          </TouchableOpacity>
        </View>

        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{servicesTitle}</Text>
            <View style={styles.tagsContainer}>
              {services.map((service, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{service.serviceName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {knowledge.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{knowledgeTitle}</Text>
            <View style={styles.tagsContainer}>
              {knowledge.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item.topic}</Text>
                </View>
              ))}
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginRight: 8,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fullName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  editButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.text,
  },
  bottomPadding: {
    height: 100,
  },
});
