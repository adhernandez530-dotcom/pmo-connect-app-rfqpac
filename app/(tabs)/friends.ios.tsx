
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ImageSourcePropType, TextInput } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Friend {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  location?: string;
  mutualFriends?: number;
}

interface FriendRequest {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('FriendsScreen: Loading friends and requests');
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      console.log('FriendsScreen: Fetching friends from backend');
      const response = await fetch(`${BACKEND_URL}/api/friends`);
      const data = await response.json();
      console.log('FriendsScreen: Friends response:', data);
      
      if (Array.isArray(data)) {
        setFriends(data);
      } else {
        console.log('FriendsScreen: API returned non-array data (likely error):', data);
        setFriends([]);
      }
    } catch (error) {
      console.error('FriendsScreen: Error loading friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      console.log('FriendsScreen: Fetching friend requests from backend');
      const response = await fetch(`${BACKEND_URL}/api/friends/requests`);
      const data = await response.json();
      console.log('FriendsScreen: Friend requests response:', data);
      
      if (Array.isArray(data)) {
        setFriendRequests(data);
      } else {
        console.log('FriendsScreen: API returned non-array data (likely error):', data);
        setFriendRequests([]);
      }
    } catch (error) {
      console.error('FriendsScreen: Error loading friend requests:', error);
      setFriendRequests([]);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    console.log('FriendsScreen: User accepted friend request from:', userId);
    try {
      await fetch(`${BACKEND_URL}/api/friends/accept/${userId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      loadFriendRequests();
      loadFriends();
    } catch (error) {
      console.error('FriendsScreen: Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    console.log('FriendsScreen: User rejected friend request from:', userId);
    try {
      await fetch(`${BACKEND_URL}/api/friends/reject/${userId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      loadFriendRequests();
    } catch (error) {
      console.error('FriendsScreen: Error rejecting friend request:', error);
    }
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const filteredFriends = friends.filter(friend => {
    const query = searchQuery.toLowerCase();
    const matchesName = friend.fullName.toLowerCase().includes(query);
    const matchesUsername = friend.username.toLowerCase().includes(query);
    const matchesLocation = friend.location?.toLowerCase().includes(query);
    return matchesName || matchesUsername || matchesLocation;
  });

  const friendRequestsTitle = 'Friend Requests';
  const myFriendsTitle = 'My Friends';
  const noFriendsText = 'No friends yet';
  const noResultsText = 'No friends found';
  const acceptText = 'Accept';
  const rejectText = 'Reject';
  const searchPlaceholder = 'Search friends...';
  const friendsCountText = `${filteredFriends.length} ${filteredFriends.length === 1 ? 'Friend' : 'Friends'}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Friends', headerLargeTitle: true }} />
      
      <View style={styles.searchContainer}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{friendRequestsTitle}</Text>
            {friendRequests.map((request, index) => {
              const initials = getInitials(request.fullName);
              return (
                <View key={index} style={styles.requestCard}>
                  <View style={styles.userInfo}>
                    {request.avatarUrl ? (
                      <Image source={resolveImageSource(request.avatarUrl)} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                    )}
                    <View style={styles.userDetails}>
                      <Text style={styles.fullName}>{request.fullName}</Text>
                      <Text style={styles.username}>@{request.username}</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRequest(request.userId)}
                    >
                      <Text style={styles.acceptButtonText}>{acceptText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(request.userId)}
                    >
                      <Text style={styles.rejectButtonText}>{rejectText}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{myFriendsTitle}</Text>
            {friends.length > 0 && (
              <Text style={styles.friendsCount}>{friendsCountText}</Text>
            )}
          </View>
          {filteredFriends.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name={searchQuery ? "magnifyingglass" : "person.2.slash"}
                android_material_icon_name={searchQuery ? "search-off" : "group-off"}
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                {searchQuery ? noResultsText : noFriendsText}
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {filteredFriends.map((friend, index) => {
                const initials = getInitials(friend.fullName);
                const locationText = friend.location || '';
                return (
                  <TouchableOpacity key={index} style={styles.friendCard}>
                    <View style={styles.userInfo}>
                      {friend.avatarUrl ? (
                        <Image source={resolveImageSource(friend.avatarUrl)} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <Text style={styles.fullName}>{friend.fullName}</Text>
                        <Text style={styles.username}>@{friend.username}</Text>
                        {friend.location && (
                          <View style={styles.locationContainer}>
                            <IconSymbol
                              ios_icon_name="location.fill"
                              android_material_icon_name="location-on"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.location}>{locationText}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  friendsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  requestCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  rejectButton: {
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
