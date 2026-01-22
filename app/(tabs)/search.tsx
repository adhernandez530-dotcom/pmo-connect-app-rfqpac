
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Platform } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

interface UserResult {
  id: string;
  username: string;
  fullName: string;
  location: string;
  bio: string;
  skills: string[];
  mutualFriends: number;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    console.log('SearchScreen: Loading popular skills');
    loadPopularSkills();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      console.log('SearchScreen: Searching for:', searchQuery);
      performSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const loadPopularSkills = async () => {
    console.log('SearchScreen: Fetching popular skills');
    // TODO: Backend Integration - GET /api/skills/popular to fetch popular skills
    // Returns: [{ skillName: string, userCount: number }]
    
    // Mock data for now
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
  };

  const performSearch = async () => {
    setIsSearching(true);
    console.log('SearchScreen: Performing search for:', searchQuery);
    // TODO: Backend Integration - GET /api/search/users?query={searchQuery} to search users by skill or name
    // Returns: [{ id, username, fullName, location, bio, skills: [string], mutualFriends: number }]
    
    // Mock data for now
    setTimeout(() => {
      setSearchResults([
        {
          id: '1',
          username: 'johndoe',
          fullName: 'John Doe',
          location: 'Brooklyn, NY',
          bio: 'Full-stack developer passionate about React Native',
          skills: ['Web Development', 'React Native', 'Node.js'],
          mutualFriends: 3,
        },
        {
          id: '2',
          username: 'janesmth',
          fullName: 'Jane Smith',
          location: 'Manhattan, NY',
          bio: 'Creative designer with 5 years of experience',
          skills: ['Graphic Design', 'UI/UX', 'Branding'],
          mutualFriends: 1,
        },
      ]);
      setIsSearching(false);
    }, 500);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol 
            ios_icon_name="magnifyingglass" 
            android_material_icon_name="search" 
            size={20} 
            color={colors.textSecondary} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by skill or name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="cancel" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
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
