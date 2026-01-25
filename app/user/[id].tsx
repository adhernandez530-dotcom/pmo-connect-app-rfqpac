
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ImageSourcePropType,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch } from "@/utils/api";

const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  "https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev";

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  location: string;
  bio: string;
  avatarUrl?: string;
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

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: "" };
  if (typeof source === "string") return { uri: source };
  return source as ImageSourcePropType;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>("none");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const loadUserProfile = React.useCallback(async () => {
    console.log("UserProfileScreen: Fetching user profile");
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
      const data = await response.json();
      console.log("UserProfileScreen: Profile data received:", data);
      setProfile(data);
    } catch (error) {
      console.error("UserProfileScreen: Error loading profile:", error);
      Alert.alert("Error", "Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadUserServices = React.useCallback(async () => {
    console.log("UserProfileScreen: Fetching user services");
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}/services`);
      if (response.ok) {
        const data = await response.json();
        console.log("UserProfileScreen: Services data received:", data);
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("UserProfileScreen: Error loading services:", error);
    }
  }, [id]);

  const loadUserKnowledge = React.useCallback(async () => {
    console.log("UserProfileScreen: Fetching user knowledge");
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}/knowledge`);
      if (response.ok) {
        const data = await response.json();
        console.log("UserProfileScreen: Knowledge data received:", data);
        setKnowledge(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("UserProfileScreen: Error loading knowledge:", error);
    }
  }, [id]);

  const checkFriendshipStatus = React.useCallback(async () => {
    console.log("UserProfileScreen: Checking friendship status");
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/friends/status/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("UserProfileScreen: Friendship status:", data);
        setFriendshipStatus(data.status || "none");
      }
    } catch (error) {
      console.error("UserProfileScreen: Error checking friendship status:", error);
    }
  }, [id]);

  useEffect(() => {
    console.log("UserProfileScreen: Loading profile for user ID:", id);
    loadUserProfile();
    loadUserServices();
    loadUserKnowledge();
    checkFriendshipStatus();
  }, [id, loadUserProfile, loadUserServices, loadUserKnowledge, checkFriendshipStatus]);

  const handleSendFriendRequest = async () => {
    console.log("UserProfileScreen: User tapped Send Friend Request button");
    setIsSendingRequest(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId: id }),
      });

      if (response.ok) {
        console.log("UserProfileScreen: Friend request sent successfully");
        Alert.alert("Success", "Friend request sent!");
        setFriendshipStatus("pending_sent");
      } else {
        const errorData = await response.json();
        console.error("UserProfileScreen: Error sending friend request:", errorData);
        Alert.alert("Error", errorData.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("UserProfileScreen: Error sending friend request:", error);
      Alert.alert("Error", "Failed to send friend request");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleMessage = () => {
    console.log("UserProfileScreen: User tapped Message button");
    router.push(`/chat/${id}`);
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(" ");
    const firstInitial = nameParts[0]?.[0] || "";
    const lastInitial = nameParts[1]?.[0] || "";
    return firstInitial + lastInitial;
  };

  const getFriendButtonText = () => {
    if (friendshipStatus === "friends") return "Friends";
    if (friendshipStatus === "pending_sent") return "Request Sent";
    if (friendshipStatus === "pending_received") return "Accept Request";
    return "Friend Request";
  };

  const isFriendButtonDisabled = () => {
    return friendshipStatus === "pending_sent" || friendshipStatus === "friends";
  };

  if (isLoading || !profile) {
    const loadingText = "Loading...";
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Profile",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </View>
    );
  }

  const initials = getInitials(profile.fullName);
  const friendButtonText = getFriendButtonText();
  const friendButtonDisabled = isFriendButtonDisabled();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: profile.username,
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {profile.avatarUrl ? (
            <Image
              source={resolveImageSource(profile.avatarUrl)}
              style={styles.avatar}
            />
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
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          )}
        </View>

        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.friendButton,
              friendButtonDisabled && styles.friendButtonDisabled,
            ]}
            onPress={handleSendFriendRequest}
            disabled={friendButtonDisabled || isSendingRequest}
          >
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person-add"
              size={20}
              color={friendButtonDisabled ? colors.textSecondary : colors.background}
            />
            <Text
              style={[
                styles.friendButtonText,
                friendButtonDisabled && styles.friendButtonTextDisabled,
              ]}
            >
              {friendButtonText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
            <IconSymbol
              ios_icon_name="message.fill"
              android_material_icon_name="message"
              size={20}
              color={colors.background}
            />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>

        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.chipsContainer}>
              {services.map((service, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{service.serviceName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {knowledge.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Knowledge</Text>
            <View style={styles.chipsContainer}>
              {knowledge.map((item, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{item.topic}</Text>
                </View>
              ))}
            </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.primary,
  },
  fullName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  friendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  friendButtonDisabled: {
    backgroundColor: colors.backgroundAlt,
  },
  friendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.background,
  },
  friendButtonTextDisabled: {
    color: colors.textSecondary,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.background,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
});
