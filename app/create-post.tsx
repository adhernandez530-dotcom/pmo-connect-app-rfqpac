
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
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch, BACKEND_URL } from "@/utils/api";

interface Service {
  id: string;
  serviceName: string;
}

interface Knowledge {
  id: string;
  topic: string;
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

  const preselectedTag = params.tag as string | undefined;

  useEffect(() => {
    console.log("CreatePostScreen: Loading user services and knowledge");
    loadServices();
    loadKnowledge();
    
    if (preselectedTag) {
      console.log("CreatePostScreen: Preselecting tag:", preselectedTag);
      setSelectedTags([preselectedTag]);
    }
  }, [preselectedTag]);

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

  const handlePickImage = async () => {
    console.log("CreatePostScreen: User tapped pick image");
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log("CreatePostScreen: Media selected:", result.assets[0].uri);
      setSelectedMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type === "video" ? "video" : "image");
    }
  };

  const handleRemoveMedia = () => {
    console.log("CreatePostScreen: User removed media");
    setSelectedMedia(null);
    setMediaType(null);
  };

  const toggleTag = (tag: string) => {
    console.log("CreatePostScreen: User toggled tag:", tag);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedMedia) {
      Alert.alert("Error", "Please add some content or media to your post");
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

      console.log("CreatePostScreen: Creating post with content:", postContent);
      const response = await authenticatedFetch(`${BACKEND_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: postContent,
          mediaUrl: mediaUrl,
          mediaType: uploadedMediaType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const post = await response.json();
      console.log("CreatePostScreen: Post created successfully:", post);

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
  const tagsTitle = "Tag your post";
  const noTagsText = "Add services or knowledge topics in your profile to tag posts";
  const postButtonText = "Post";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Create Post",
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

        <TouchableOpacity style={styles.addMediaButton} onPress={handlePickImage}>
          <IconSymbol
            ios_icon_name="photo"
            android_material_icon_name="image"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.addMediaText}>{addMediaText}</Text>
        </TouchableOpacity>

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
  addMediaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addMediaText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  postButton: {
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
});
