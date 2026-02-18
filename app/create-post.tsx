
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch, BACKEND_URL } from "@/utils/api";
import { validateContent } from "@/utils/contentModeration";

interface Service {
  id: string;
  serviceName: string;
}

interface Knowledge {
  id: string;
  topic: string;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: "" };
  if (typeof source === "string") return { uri: source };
  return source as ImageSourcePropType;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Instagram-like features
  const [location, setLocation] = useState<string>("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
  const [showUserTagModal, setShowUserTagModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showDraftOptions, setShowDraftOptions] = useState(false);

  const preselectedTag = params.tag as string | undefined;
  const draftId = params.draftId as string | undefined;

  useEffect(() => {
    console.log("CreatePostScreen: Loading user services and knowledge");
    loadServices();
    loadKnowledge();
    
    if (preselectedTag) {
      console.log("CreatePostScreen: Preselecting tag:", preselectedTag);
      setSelectedTags([preselectedTag]);
    }

    if (draftId) {
      console.log("CreatePostScreen: Loading draft:", draftId);
      loadDraft(draftId);
    }
  }, [preselectedTag, draftId]);

  const loadServices = async () => {
    try {
      console.log("CreatePostScreen: Fetching user services");
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/services`);
      if (!response.ok) {
        console.log("CreatePostScreen: Services API returned error");
        setServices([]);
        return;
      }
      const data = await response.json();
      console.log("CreatePostScreen: Services loaded:", data);
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (error) {
      console.error("CreatePostScreen: Error loading services:", error);
      setServices([]);
    }
  };

  const loadKnowledge = async () => {
    try {
      console.log("CreatePostScreen: Fetching user knowledge");
      const response = await authenticatedFetch(`${BACKEND_URL}/api/profile/knowledge`);
      if (!response.ok) {
        console.log("CreatePostScreen: Knowledge API returned error");
        setKnowledge([]);
        return;
      }
      const data = await response.json();
      console.log("CreatePostScreen: Knowledge loaded:", data);
      if (Array.isArray(data)) {
        setKnowledge(data);
      }
    } catch (error) {
      console.error("CreatePostScreen: Error loading knowledge:", error);
      setKnowledge([]);
    }
  };

  const loadDraft = async (id: string) => {
    try {
      console.log("CreatePostScreen: Loading draft:", id);
      const response = await authenticatedFetch(`${BACKEND_URL}/api/posts/drafts`);
      if (!response.ok) {
        console.log("CreatePostScreen: Failed to load drafts");
        return;
      }
      const drafts = await response.json();
      const draft = drafts.find((d: any) => d.id === id);
      if (draft) {
        setContent(draft.content || "");
        setSelectedMedia(draft.mediaUrl || null);
        setMediaType(draft.mediaType || null);
        setLocation(draft.location || "");
        if (draft.taggedUserIds && Array.isArray(draft.taggedUserIds)) {
          // Load tagged users info
          const users = await Promise.all(
            draft.taggedUserIds.map(async (userId: string) => {
              const userResponse = await authenticatedFetch(`${BACKEND_URL}/api/users/${userId}`);
              if (userResponse.ok) {
                return await userResponse.json();
              }
              return null;
            })
          );
          setTaggedUsers(users.filter((u) => u !== null));
        }
      }
    } catch (error) {
      console.error("CreatePostScreen: Error loading draft:", error);
    }
  };

  const handlePickImage = async () => {
    console.log("CreatePostScreen: User tapped pick image");
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        console.log("CreatePostScreen: Media selected:", result.assets[0].uri);
        setSelectedMedia(result.assets[0].uri);
        setMediaType(result.assets[0].type === "video" ? "video" : "image");
      }
    } catch (error) {
      console.error("CreatePostScreen: Error picking image:", error);
      Alert.alert("Error", "Failed to pick media. Please try again.");
    }
  };

  const handleTakePhoto = async () => {
    console.log("CreatePostScreen: User tapped take photo");
    
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your camera");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        console.log("CreatePostScreen: Photo taken:", result.assets[0].uri);
        setSelectedMedia(result.assets[0].uri);
        setMediaType("image");
      }
    } catch (error) {
      console.error("CreatePostScreen: Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleRemoveMedia = () => {
    console.log("CreatePostScreen: User removed media");
    setSelectedMedia(null);
    setMediaType(null);
  };

  const handleGetLocation = async () => {
    console.log("CreatePostScreen: User tapped get location");
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your location");
        setIsLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const locationString = [address.city, address.region, address.country]
        .filter(Boolean)
        .join(", ");
      
      console.log("CreatePostScreen: Location found:", locationString);
      setLocation(locationString);
      setShowLocationModal(false);
    } catch (error) {
      console.error("CreatePostScreen: Error getting location:", error);
      Alert.alert("Error", "Failed to get your location");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchedUsers([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      console.log("CreatePostScreen: Searching users:", query);
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const users = await response.json();
        console.log("CreatePostScreen: Users found:", users);
        setSearchedUsers(users);
      }
    } catch (error) {
      console.error("CreatePostScreen: Error searching users:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleTagUser = (user: User) => {
    console.log("CreatePostScreen: Tagging user:", user.username);
    if (!taggedUsers.find((u) => u.id === user.id)) {
      setTaggedUsers([...taggedUsers, user]);
    }
    setUserSearchQuery("");
    setSearchedUsers([]);
  };

  const handleRemoveTaggedUser = (userId: string) => {
    console.log("CreatePostScreen: Removing tagged user:", userId);
    setTaggedUsers(taggedUsers.filter((u) => u.id !== userId));
  };

  const toggleTag = (tag: string) => {
    console.log("CreatePostScreen: User toggled tag:", tag);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim() && !selectedMedia) {
      Alert.alert("Error", "Please add some content or media to save as draft");
      return;
    }

    // Validate content for inappropriate language
    const validation = validateContent(content);
    if (!validation.isValid) {
      console.log("CreatePostScreen: Content moderation failed for draft");
      Alert.alert("Inappropriate Content", validation.errorMessage);
      return;
    }

    console.log("CreatePostScreen: User tapped save draft");
    setIsSubmitting(true);

    try {
      let mediaUrl = null;
      let uploadedMediaType = null;

      if (selectedMedia) {
        console.log("CreatePostScreen: Uploading media for draft");
        const formData = new FormData();
        const filename = selectedMedia.split("/").pop() || "media";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `${mediaType}/${match[1]}` : mediaType;

        formData.append("media", {
          uri: selectedMedia,
          name: filename,
          type: type,
        } as any);

        const uploadResponse = await authenticatedFetch(`${BACKEND_URL}/api/posts/media`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload media");
        }

        const uploadData = await uploadResponse.json();
        console.log("CreatePostScreen: Media uploaded:", uploadData);
        mediaUrl = uploadData.url;
        uploadedMediaType = uploadData.mediaType;
      }

      const draftData = {
        content: content,
        mediaUrl: mediaUrl,
        mediaType: uploadedMediaType,
        location: location || undefined,
        taggedUserIds: taggedUsers.map((u) => u.id),
      };

      const endpoint = draftId
        ? `${BACKEND_URL}/api/posts/drafts/${draftId}`
        : `${BACKEND_URL}/api/posts/drafts`;
      const method = draftId ? "PUT" : "POST";

      console.log("CreatePostScreen: Saving draft:", draftData);
      const response = await authenticatedFetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      const draft = await response.json();
      console.log("CreatePostScreen: Draft saved successfully:", draft);

      Alert.alert("Success", "Your draft has been saved!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("CreatePostScreen: Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedMedia) {
      Alert.alert("Error", "Please add some content or media to your post");
      return;
    }

    // Validate content for inappropriate language
    const validation = validateContent(content);
    if (!validation.isValid) {
      console.log("CreatePostScreen: Content moderation failed");
      Alert.alert("Inappropriate Content", validation.errorMessage);
      return;
    }

    console.log("CreatePostScreen: User tapped submit post");
    setIsSubmitting(true);

    try {
      let mediaUrl = null;
      let uploadedMediaType = null;

      if (selectedMedia) {
        console.log("CreatePostScreen: Uploading media");
        const formData = new FormData();
        const filename = selectedMedia.split("/").pop() || "media";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `${mediaType}/${match[1]}` : mediaType;

        formData.append("media", {
          uri: selectedMedia,
          name: filename,
          type: type,
        } as any);

        const uploadResponse = await authenticatedFetch(`${BACKEND_URL}/api/posts/media`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload media");
        }

        const uploadData = await uploadResponse.json();
        console.log("CreatePostScreen: Media uploaded:", uploadData);
        mediaUrl = uploadData.url;
        uploadedMediaType = uploadData.mediaType;
      }

      const postContent = selectedTags.length > 0
        ? `${content}\n\n#${selectedTags.join(" #")}`
        : content;

      const postData = {
        content: postContent,
        mediaUrl: mediaUrl,
        mediaType: uploadedMediaType,
        location: location || undefined,
        taggedUserIds: taggedUsers.map((u) => u.id),
      };

      console.log("CreatePostScreen: Creating post with data:", postData);
      const response = await authenticatedFetch(`${BACKEND_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const post = await response.json();
      console.log("CreatePostScreen: Post created successfully:", post);

      // If this was a draft, delete it
      if (draftId) {
        await authenticatedFetch(`${BACKEND_URL}/api/posts/drafts/${draftId}`, {
          method: "DELETE",
        });
      }

      Alert.alert("Success", "Your post has been created!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("CreatePostScreen: Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allTags = [
    ...services.map((s) => s.serviceName),
    ...knowledge.map((k) => k.topic),
  ];

  const placeholderText = "What's on your mind?";
  const addMediaText = "Add Photo/Video";
  const takePhotoText = "Take Photo";
  const addLocationText = location ? location : "Add Location";
  const tagPeopleText = "Tag People";
  const tagsTitle = "Tag your post";
  const noTagsText = "Add services or knowledge topics in your profile to tag posts";
  const postButtonText = "Post";
  const saveDraftText = "Save Draft";
  const locationModalTitle = "Add Location";
  const useCurrentLocationText = "Use Current Location";
  const manualLocationText = "Enter Location Manually";
  const tagPeopleModalTitle = "Tag People";
  const searchPlaceholder = "Search people...";
  const taggedText = "Tagged";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: draftId ? "Edit Draft" : "Create Post",
          headerBackTitle: "Back",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowDraftOptions(true)}>
              <IconSymbol
                ios_icon_name="ellipsis.circle"
                android_material_icon_name="more-vert"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentSection}>
          <TextInput
            style={styles.textInput}
            placeholder={placeholderText}
            placeholderTextColor={colors.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
          />
        </View>

        {selectedMedia && (
          <View style={styles.mediaPreview}>
            <Image source={resolveImageSource(selectedMedia)} style={styles.mediaImage} />
            <TouchableOpacity style={styles.removeMediaButton} onPress={handleRemoveMedia}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePickImage}>
            <IconSymbol
              ios_icon_name="photo"
              android_material_icon_name="image"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionText}>{addMediaText}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
            <IconSymbol
              ios_icon_name="camera"
              android_material_icon_name="camera"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionText}>{takePhotoText}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowLocationModal(true)}>
            <IconSymbol
              ios_icon_name="location"
              android_material_icon_name="location-on"
              size={20}
              color={location ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.actionText, location && styles.actionTextActive]}>
              {addLocationText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowUserTagModal(true)}>
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person-add"
              size={20}
              color={taggedUsers.length > 0 ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.actionText, taggedUsers.length > 0 && styles.actionTextActive]}>
              {tagPeopleText}
            </Text>
            {taggedUsers.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{taggedUsers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {taggedUsers.length > 0 && (
          <View style={styles.taggedUsersSection}>
            <Text style={styles.taggedUsersTitle}>{taggedText}</Text>
            <View style={styles.taggedUsersContainer}>
              {taggedUsers.map((user) => {
                const userInitials = user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                return (
                  <View key={user.id} style={styles.taggedUserChip}>
                    <View style={styles.taggedUserAvatar}>
                      {user.avatarUrl ? (
                        <Image
                          source={resolveImageSource(user.avatarUrl)}
                          style={styles.taggedUserAvatarImage}
                        />
                      ) : (
                        <Text style={styles.taggedUserInitials}>{userInitials}</Text>
                      )}
                    </View>
                    <Text style={styles.taggedUserName}>{user.username}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTaggedUser(user.id)}>
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {allTags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>{tagsTitle}</Text>
            <View style={styles.tagsContainer}>
              {allTags.map((tag, index) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {allTags.length === 0 && (
          <View style={styles.noTagsContainer}>
            <Text style={styles.noTagsText}>{noTagsText}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={handleSaveDraft}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonText}>{saveDraftText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postButton, isSubmitting && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.postButtonText}>{postButtonText}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{locationModalTitle}</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleGetLocation}
              disabled={isLoadingLocation}
            >
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="my-location"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.modalButtonText}>{useCurrentLocationText}</Text>
              {isLoadingLocation && <ActivityIndicator size="small" color={colors.primary} />}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TextInput
              style={styles.locationInput}
              placeholder={manualLocationText}
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalSaveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Tag Modal */}
      <Modal
        visible={showUserTagModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tagPeopleModalTitle}</Text>
              <TouchableOpacity onPress={() => setShowUserTagModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

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
                value={userSearchQuery}
                onChangeText={handleSearchUsers}
                autoFocus
              />
              {isSearchingUsers && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            <FlatList
              data={searchedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const userInitials = item.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                const isTagged = taggedUsers.find((u) => u.id === item.id);
                return (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => handleTagUser(item)}
                    disabled={!!isTagged}
                  >
                    <View style={styles.userAvatar}>
                      {item.avatarUrl ? (
                        <Image
                          source={resolveImageSource(item.avatarUrl)}
                          style={styles.userAvatarImage}
                        />
                      ) : (
                        <Text style={styles.userInitials}>{userInitials}</Text>
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.fullName}</Text>
                      <Text style={styles.userUsername}>@{item.username}</Text>
                    </View>
                    {isTagged && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                userSearchQuery.length >= 2 && !isSearchingUsers ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No users found</Text>
                  </View>
                ) : null
              }
              style={styles.userList}
            />
          </View>
        </View>
      </Modal>

      {/* Draft Options Modal */}
      <Modal
        visible={showDraftOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDraftOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDraftOptions(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowDraftOptions(false);
                router.push("/drafts");
              }}
            >
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={20}
                color={colors.text}
              />
              <Text style={styles.optionText}>View All Drafts</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentSection: {
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  mediaPreview: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mediaImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeMediaButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 14,
  },
  actionsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  actionTextActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.background,
  },
  taggedUsersSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  taggedUsersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  taggedUsersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  taggedUserChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taggedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  taggedUserAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  taggedUserInitials: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.background,
  },
  taggedUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  tagsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  tagTextSelected: {
    color: colors.background,
  },
  noTagsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  noTagsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  postButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  locationInput: {
    fontSize: 16,
    color: colors.text,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  userList: {
    maxHeight: 400,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.background,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  userUsername: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionsMenu: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: "auto",
    marginBottom: Platform.OS === "ios" ? 100 : 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
});
