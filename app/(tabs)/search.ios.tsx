
import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

interface UserResult {
  id: string;
  username: string;
  fullName: string;
  location: string;
  bio: string;
  skills: string[];
  mutualFriends: number;
}

type FilterType = 'friends' | 'put_me_on' | 'anyone';
type LocationFilter = 'nearby' | 'anywhere';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<FilterType>('friends');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('anywhere');

  useEffect(() => {
    console.log('SearchScreen: Loading popular skills');
    loadPopularSkills();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      console.log('SearchScreen: Searching for:', searchQuery, 'with filter:', filter, locationFilter);
      performSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, filter, locationFilter]);

  const loadPopularSkills = async () => {
    console.log('SearchScreen: Fetching popular skills');
    try {
      const response = await fetch(`${BACKEND_URL}/api/search/skills?popular=true`);
      const data = await response.json();
      console.log('SearchScreen: Popular skills response:', data);
      
      if (Array.isArray(data)) {
        // Extract skill names from the response
        const skillNames = data.map((skill: any) => skill.skillName || skill.name || skill);
        setPopularSkills(skillNames);
      } else {
        console.log('SearchScreen: API returned non-array data, using fallback skills');
        // Fallback to default skills if API fails
        setPopularSkills([
          'Project Management',
          'DJ Services',
          'Cooking',
          'Web Development',
          'Graphic Design',
          'Photography',
          'Music Production',
          'Video Editing',
        ]);
      }
    } catch (error) {
      console.error('SearchScreen: Error loading popular skills:', error);
      // Fallback to default skills if API fails
      setPopularSkills([
        'Project Management',
        'DJ Services',
        'Cooking',
        'Web Development',
        'Graphic Design',
        'Photography',
        'Music Production',
        'Video Editing',
      ]);
    }
  };

  const performSearch = async () => {
    setIsSearching(true);
    console.log('SearchScreen: Performing search for:', searchQuery);
    
    try {
      const queryParams = new URLSearchParams({
        query: searchQuery,
        filter: filter,
        location: locationFilter,
      });
      
      const response = await fetch(`${BACKEND_URL}/api/search/users?${queryParams.toString()}`);
      const data = await response.json();
      console.log('SearchScreen: Search results response:', data);
      
      if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        console.log('SearchScreen: API returned non-array data:', data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('SearchScreen: Error performing search:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSkillPress = (skill: string) => {
    console.log('SearchScreen: User tapped skill:', skill);
    setSearchQuery(skill);
  };

  const handleUserPress = (user: UserResult) => {
    console.log('SearchScreen: User tapped profile:', user.username);
    // TODO: Navigate to user profile screen
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const searchingText = 'Searching...';
  const noResultsText = 'No results found';
  const tryDifferentText = 'Try searching for a different skill or name';
  const popularSkillsText = 'Popular Skills';
  const discoverText = 'Discover people by their skills and expertise';
  const friendsText = 'Friends';
  const putMeOnText = 'Put me On';
  const anyoneText = 'Anyone';
  const nearbyText = 'Nearby';
  const anywhereText = 'Anywhere';

  return (
    <>
      <Stack.Screen
        options={{
          title: "Search",
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: "Search by skill or name...",
            onChangeText: (event: any) => setSearchQuery(event.nativeEvent.text),
          },
        }}
      />
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'friends' && styles.filterButtonActive]}
            onPress={() => setFilter('friends')}
          >
            <Text style={[styles.filterButtonText, filter === 'friends' && styles.filterButtonTextActive]}>
              {friendsText}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'put_me_on' && styles.filterButtonActive]}
            onPress={() => setFilter('put_me_on')}
          >
            <Text style={[styles.filterButtonText, filter === 'put_me_on' && styles.filterButtonTextActive]}>
              {putMeOnText}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'anyone' && styles.filterButtonActive]}
            onPress={() => setFilter('anyone')}
          >
            <Text style={[styles.filterButtonText, filter === 'anyone' && styles.filterButtonTextActive]}>
              {anyoneText}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationFilterContainer}>
          <TouchableOpacity
            style={[styles.locationButton, locationFilter === 'nearby' && styles.locationButtonActive]}
            onPress={() => setLocationFilter('nearby')}
          >
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location-on"
              size={16}
              color={locationFilter === 'nearby' ? colors.background : colors.textSecondary}
            />
            <Text style={[styles.locationButtonText, locationFilter === 'nearby' && styles.locationButtonTextActive]}>
              {nearbyText}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.locationButton, locationFilter === 'anywhere' && styles.locationButtonActive]}
            onPress={() => setLocationFilter('anywhere')}
          >
            <IconSymbol
              ios_icon_name="globe"
              android_material_icon_name="public"
              size={16}
              color={locationFilter === 'anywhere' ? colors.background : colors.textSecondary}
            />
            <Text style={[styles.locationButtonText, locationFilter === 'anywhere' && styles.locationButtonTextActive]}>
              {anywhereText}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {searchQuery.length === 0 ? (
            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>{popularSkillsText}</Text>
              <Text style={styles.sectionSubtitle}>{discoverText}</Text>
              <View style={styles.skillsGrid}>
                {popularSkills.map((skill, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.skillChip}
                    onPress={() => handleSkillPress(skill)}
                  >
                    <Text style={styles.skillChipText}>{skill}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : isSearching ? (
            <View style={styles.centerContent}>
              <Text style={styles.searchingText}>{searchingText}</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.centerContent}>
              <IconSymbol 
                ios_icon_name="magnifyingglass" 
                android_material_icon_name="search" 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={styles.noResultsText}>{noResultsText}</Text>
              <Text style={styles.noResultsSubtext}>{tryDifferentText}</Text>
            </View>
          ) : (
            <View style={styles.resultsSection}>
              {searchResults.map((user, index) => {
                const initials = getInitials(user.fullName);
                const mutualText = user.mutualFriends > 0 
                  ? `${user.mutualFriends} mutual friend${user.mutualFriends > 1 ? 's' : ''}`
                  : 'No mutual friends';
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.userCard}
                    onPress={() => handleUserPress(user)}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.fullName}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                      <View style={styles.userLocation}>
                        <IconSymbol 
                          ios_icon_name="location.fill" 
                          android_material_icon_name="location-on" 
                          size={14} 
                          color={colors.textSecondary} 
                        />
                        <Text style={styles.userLocationText}>{user.location}</Text>
                      </View>
                      <Text style={styles.userBio}>{user.bio}</Text>
                      <View style={styles.userSkills}>
                        {user.skills.slice(0, 3).map((skill, skillIndex) => (
                          <View key={skillIndex} style={styles.userSkillChip}>
                            <Text style={styles.userSkillText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.mutualFriends}>{mutualText}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.background,
  },
  locationFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
  },
  locationButtonActive: {
    backgroundColor: colors.primary,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locationButtonTextActive: {
    color: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  popularSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillChip: {
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  skillChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  searchingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resultsSection: {
    padding: 20,
    gap: 16,
  },
  userCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  userLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  userLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userBio: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  userSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  userSkillChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userSkillText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  mutualFriends: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
