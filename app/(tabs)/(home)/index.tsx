
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

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

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [servicesExpanded, setServicesExpanded] = useState(true);

  useEffect(() => {
    console.log('HomeScreen: Loading user profile and services');
    loadProfile();
    loadServices();
  }, []);

  const loadProfile = async () => {
    console.log('HomeScreen: Fetching user profile');
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/me`);
      const data = await response.json();
      console.log('HomeScreen: Profile loaded successfully', data);
      
      // Only set profile if it's valid (not an error object)
      if (data && !data.error) {
        setProfile(data);
      } else {
        console.log('HomeScreen: Profile API returned error or invalid data:', data);
      }
    } catch (error) {
      console.error('HomeScreen: Error loading profile:', error);
    }
  };

  const loadServices = async () => {
    console.log('HomeScreen: Fetching user services');
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/services`);
      const data = await response.json();
      console.log('HomeScreen: Services loaded successfully', data);
      
      // Only set services if it's a valid array
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        console.log('HomeScreen: Services API returned non-array data:', data);
        setServices([]);
      }
    } catch (error) {
      console.error('HomeScreen: Error loading services:', error);
      setServices([]);
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
    // TODO: Navigate to settings screen
  };

  const handleAddPost = () => {
    console.log('HomeScreen: User tapped Add Post button');
    // TODO: Navigate to create post screen
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const initials = profile ? getInitials(profile.fullName) : 'A';
  const friendsText = profile ? `${profile.friendsCount} Friends` : '0 Friends';
  const myServicesTitle = 'My Services';
  const allServicesText = 'ALL';
  const addPostText = 'Add Post';
  const noPostsText = 'No posts yet. Share your work!';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}>
            <IconSymbol 
              ios_icon_name="bell.fill" 
              android_material_icon_name="notifications" 
              size={24} 
              color={colors.primary} 
            />
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
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <View style={styles.serviceFilters}>
                <TouchableOpacity
                  style={[styles.serviceFilter, selectedService === 'ALL' && styles.serviceFilterActive]}
                  onPress={() => setSelectedService('ALL')}
                >
                  <Text style={[styles.serviceFilterText, selectedService === 'ALL' && styles.serviceFilterTextActive]}>
                    {allServicesText}
                  </Text>
                </TouchableOpacity>
                {services.map((service, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.serviceFilter, selectedService === service.serviceName && styles.serviceFilterActive]}
                    onPress={() => setSelectedService(service.serviceName)}
                  >
                    <Text style={[styles.serviceFilterText, selectedService === service.serviceName && styles.serviceFilterTextActive]}>
                      {service.serviceName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.addPostButton} onPress={handleAddPost}>
                <IconSymbol 
                  ios_icon_name="plus" 
                  android_material_icon_name="add" 
                  size={20} 
                  color={colors.background} 
                />
                <Text style={styles.addPostButtonText}>{addPostText}</Text>
              </TouchableOpacity>

              <View style={styles.postsContainer}>
                <Text style={styles.noPostsText}>{noPostsText}</Text>
              </View>
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
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
  serviceFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceFilter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  serviceFilterActive: {
    backgroundColor: colors.primary,
  },
  serviceFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  serviceFilterTextActive: {
    color: colors.background,
  },
  addPostButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  addPostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  postsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noPostsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
