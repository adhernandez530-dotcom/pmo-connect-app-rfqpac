
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { colors } from "@/styles/commonStyles";
import { Stack, useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import Constants from "expo-constants";
import { authenticatedFetch } from "@/utils/api";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

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

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [notificationsExpanded, setNotificationsExpanded] = useState(true);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [knowledgeExpanded, setKnowledgeExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log('HomeScreen: Loading user profile, services, and knowledge');
    loadProfile();
    loadServices();
    loadKnowledge();
    loadUnreadCount();
  }, []);

  const loadProfile = async () => {
    console.log('HomeScreen: Fetching user profile');
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/users/me`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('HomeScreen: Profile API returned error status:', response.status, errorText);
        return;
      }
      const data = await response.json();
      console.log('HomeScreen: Profile loaded successfully', data);
      
      if (data && !data.error) {
        setProfile(data);
      } else {
        console.log('HomeScreen: Profile API returned error or invalid data:', data);
      }
    } catch (error) {
      console.error('HomeScreen: Error loading profile:', error instanceof Error ? error.message : String(error));
    }
  };

  const loadServices = async () => {
    console.log('HomeScreen: Fetching user services');
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/services`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('HomeScreen: Services API returned error status:', response.status, errorText);
        setServices([]);
        return;
      }
      const data = await response.json();
      console.log('HomeScreen: Services loaded successfully', data);
      
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        console.log('HomeScreen: Services API returned non-array data:', data);
        setServices([]);
      }
    } catch (error) {
      console.error('HomeScreen: Error loading services:', error instanceof Error ? error.message : String(error));
      setServices([]);
    }
  };

  const loadKnowledge = async () => {
    console.log('HomeScreen: Fetching user knowledge topics');
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/knowledge`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('HomeScreen: Knowledge API returned error status:', response.status, errorText);
        setKnowledge([]);
        return;
      }
      const data = await response.json();
      console.log('HomeScreen: Knowledge loaded successfully', data);
      
      if (Array.isArray(data)) {
        setKnowledge(data);
      } else {
        console.log('HomeScreen: Knowledge API returned non-array data:', data);
        setKnowledge([]);
      }
    } catch (error) {
      console.error('HomeScreen: Error loading knowledge:', error instanceof Error ? error.message : String(error));
      setKnowledge([]);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/notifications/unread-count`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('HomeScreen: Unread count API returned error status:', response.status, errorText);
        setUnreadCount(0);
        return;
      }
      const data = await response.json();
      console.log('HomeScreen: Unread notification count:', data.count);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('HomeScreen: Error loading unread count:', error instanceof Error ? error.message : String(error));
      setUnreadCount(0);
    }
  };

  const handleEditProfile = () => {
    console.log('HomeScreen: User tapped Edit Profile button');
    router.push('/edit-profile');
  };

  const handleNotificationPress = () => {
    console.log('HomeScreen: User tapped notifications icon');
    router.push('/notifications');
  };

  const handleSettingsPress = () => {
    console.log('HomeScreen: User tapped settings icon');
    router.push('/settings');
  };

  const handleFriendsPress = () => {
    console.log('HomeScreen: User tapped Friends button');
    router.push('/(tabs)/friends');
  };

  const handleCreatePost = (tag?: string) => {
    console.log('HomeScreen: User tapped create post button', tag ? `with tag: ${tag}` : '');
    if (tag) {
      router.push(`/create-post?tag=${encodeURIComponent(tag)}`);
    } else {
      router.push('/create-post');
    }
  };

  const handleServiceChipPress = (serviceName: string) => {
    console.log('HomeScreen: User tapped service chip:', serviceName);
    handleCreatePost(serviceName);
  };

  const handleKnowledgeChipPress = (topic: string) => {
    console.log('HomeScreen: User tapped knowledge chip:', topic);
    handleCreatePost(topic);
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const displayProfile = profile || {
    username: '@username',
    fullName: 'Your Name',
    location: 'Your Location',
    bio: 'Add a bio to tell others about yourself',
    friendsCount: 0
  };

  const initials = getInitials(displayProfile.fullName);
  const friendsText = `${displayProfile.friendsCount} Friends`;
  const notificationsTitle = 'Notifications';
  const noNotificationsText = 'No new notifications';
  const allCaughtUpText = "You're all caught up!";
  const myServicesTitle = 'My Services';
  const knowledgeTitle = 'Knowledge';
  const allText = 'All';
  const servicesCountText = services.length > 0 ? `${services.length}` : '0';
  const knowledgeCountText = knowledge.length > 0 ? `${knowledge.length}` : '0';
  const postButtonText = 'Post +';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Home',
          headerLargeTitle: true,
          headerRight: () => (
            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}>
                <View style={styles.notificationIconContainer}>
                  <IconSymbol 
                    ios_icon_name="bell.fill" 
                    android_material_icon_name="notifications" 
                    size={24} 
                    color={colors.primary} 
                  />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          
          <Text style={styles.username}>{displayProfile.username}</Text>
          <Text style={styles.fullName}>{displayProfile.fullName}</Text>
          
          <View style={styles.locationContainer}>
            <IconSymbol 
              ios_icon_name="location.fill" 
              android_material_icon_name="location-on" 
              size={16} 
              color={colors.textSecondary} 
            />
            <Text style={styles.location}>{displayProfile.location}</Text>
          </View>
          
          <Text style={styles.bio}>{displayProfile.bio}</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <IconSymbol 
              ios_icon_name="pencil" 
              android_material_icon_name="edit" 
              size={18} 
              color={colors.background} 
            />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.friendsButton} onPress={handleFriendsPress}>
            <Text style={styles.friendsButtonText}>{friendsText}</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={16} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.notificationsCard}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.notificationsTitle}>{notificationsTitle}</Text>
            <TouchableOpacity onPress={() => setNotificationsExpanded(!notificationsExpanded)}>
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
              <View style={styles.notificationIconContainer}>
                <IconSymbol 
                  ios_icon_name="bell.fill" 
                  android_material_icon_name="notifications" 
                  size={48} 
                  color={colors.textSecondary} 
                />
              </View>
              <Text style={styles.noNotificationsText}>{noNotificationsText}</Text>
              <Text style={styles.allCaughtUpText}>{allCaughtUpText}</Text>
            </View>
          )}
        </View>

        <View style={styles.servicesCard}>
          <View style={styles.servicesHeader}>
            <Text style={styles.servicesTitle}>{myServicesTitle}</Text>
            <TouchableOpacity onPress={() => setServicesExpanded(!servicesExpanded)}>
              <IconSymbol 
                ios_icon_name={servicesExpanded ? "chevron.up" : "chevron.down"} 
                android_material_icon_name={servicesExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          {servicesExpanded && (
            <View style={styles.servicesContent}>
              <View style={styles.filterRow}>
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{allText}</Text>
                  <Text style={styles.filterChipCount}>{servicesCountText}</Text>
                </View>
                {services.map((service, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.filterChip}
                    onPress={() => handleServiceChipPress(service.serviceName)}
                  >
                    <Text style={styles.filterChipText}>{service.serviceName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {services.length === 0 && (
                <Text style={styles.noServicesText}>No services added yet</Text>
              )}
              
              <TouchableOpacity style={styles.postButton} onPress={() => handleCreatePost()}>
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={20}
                  color={colors.background}
                />
                <Text style={styles.postButtonText}>{postButtonText}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.knowledgeCard}>
          <View style={styles.knowledgeHeader}>
            <Text style={styles.knowledgeTitle}>{knowledgeTitle}</Text>
            <TouchableOpacity onPress={() => setKnowledgeExpanded(!knowledgeExpanded)}>
              <IconSymbol 
                ios_icon_name={knowledgeExpanded ? "chevron.up" : "chevron.down"} 
                android_material_icon_name={knowledgeExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          {knowledgeExpanded && (
            <View style={styles.knowledgeContent}>
              <View style={styles.filterRow}>
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{allText}</Text>
                  <Text style={styles.filterChipCount}>{knowledgeCountText}</Text>
                </View>
                {knowledge.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.filterChip}
                    onPress={() => handleKnowledgeChipPress(item.topic)}
                  >
                    <Text style={styles.filterChipText}>{item.topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {knowledge.length === 0 && (
                <Text style={styles.noKnowledgeText}>No knowledge topics added yet</Text>
              )}
              
              <TouchableOpacity style={styles.postButton} onPress={() => handleCreatePost()}>
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={20}
                  color={colors.background}
                />
                <Text style={styles.postButtonText}>{postButtonText}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 24,
  },
  noNotificationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  allCaughtUpText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  servicesCard: {
    backgroundColor: colors.backgroundAlt,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  servicesContent: {
    marginTop: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noServicesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  postButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 8,
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
  },
  knowledgeCard: {
    backgroundColor: colors.backgroundAlt,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
  },
  knowledgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  knowledgeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  knowledgeContent: {
    marginTop: 16,
  },
  noKnowledgeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
