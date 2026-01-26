
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch, BACKEND_URL } from "@/utils/api";

interface Draft {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  location?: string;
  taggedUserIds?: string[];
  createdAt: string;
}

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: "" };
  if (typeof source === "string") return { uri: source };
  return source as ImageSourcePropType;
}

export default function DraftsScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("DraftsScreen: Loading drafts");
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      console.log("DraftsScreen: Fetching drafts");
      const response = await authenticatedFetch(`${BACKEND_URL}/api/posts/drafts`);
      if (!response.ok) {
        console.log("DraftsScreen: Failed to load drafts");
        setDrafts([]);
        return;
      }
      const data = await response.json();
      console.log("DraftsScreen: Drafts loaded:", data);
      setDrafts(data);
    } catch (error) {
      console.error("DraftsScreen: Error loading drafts:", error);
      setDrafts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDraft = (draftId: string) => {
    console.log("DraftsScreen: User tapped edit draft:", draftId);
    router.push(`/create-post?draftId=${draftId}`);
  };

  const handleDeleteDraft = (draftId: string) => {
    console.log("DraftsScreen: User tapped delete draft:", draftId);
    Alert.alert(
      "Delete Draft",
      "Are you sure you want to delete this draft?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await authenticatedFetch(
                `${BACKEND_URL}/api/posts/drafts/${draftId}`,
                {
                  method: "DELETE",
                }
              );
              if (response.ok) {
                console.log("DraftsScreen: Draft deleted successfully");
                setDrafts(drafts.filter((d) => d.id !== draftId));
              } else {
                Alert.alert("Error", "Failed to delete draft");
              }
            } catch (error) {
              console.error("DraftsScreen: Error deleting draft:", error);
              Alert.alert("Error", "Failed to delete draft");
            }
          },
        },
      ]
    );
  };

  const handlePublishDraft = async (draftId: string) => {
    console.log("DraftsScreen: User tapped publish draft:", draftId);
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/posts/drafts/${draftId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      if (response.ok) {
        console.log("DraftsScreen: Draft published successfully");
        Alert.alert("Success", "Your draft has been published!", [
          {
            text: "OK",
            onPress: () => {
              setDrafts(drafts.filter((d) => d.id !== draftId));
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to publish draft");
      }
    } catch (error) {
      console.error("DraftsScreen: Error publishing draft:", error);
      Alert.alert("Error", "Failed to publish draft");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  const titleText = "Drafts";
  const emptyStateTitle = "No drafts yet";
  const emptyStateMessage = "Your saved drafts will appear here";
  const editText = "Edit";
  const publishText = "Publish";
  const deleteText = "Delete";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: titleText,
          headerBackTitle: "Back",
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : drafts.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="doc.text"
            android_material_icon_name="description"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateTitle}>{emptyStateTitle}</Text>
          <Text style={styles.emptyStateMessage}>{emptyStateMessage}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {drafts.map((draft) => {
            const previewText = draft.content.slice(0, 100);
            const hasMore = draft.content.length > 100;
            const timeAgo = formatDate(draft.createdAt);
            return (
              <View key={draft.id} style={styles.draftCard}>
                <TouchableOpacity
                  style={styles.draftContent}
                  onPress={() => handleEditDraft(draft.id)}
                >
                  {draft.mediaUrl && (
                    <Image
                      source={resolveImageSource(draft.mediaUrl)}
                      style={styles.draftImage}
                    />
                  )}
                  <View style={styles.draftTextContainer}>
                    <Text style={styles.draftText}>
                      {previewText}
                      {hasMore && "..."}
                    </Text>
                    {draft.location && (
                      <View style={styles.draftMeta}>
                        <IconSymbol
                          ios_icon_name="location"
                          android_material_icon_name="location-on"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.draftMetaText}>{draft.location}</Text>
                      </View>
                    )}
                    {draft.taggedUserIds && draft.taggedUserIds.length > 0 && (
                      <View style={styles.draftMeta}>
                        <IconSymbol
                          ios_icon_name="person.badge.plus"
                          android_material_icon_name="person-add"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.draftMetaText}>
                          {draft.taggedUserIds.length} people tagged
                        </Text>
                      </View>
                    )}
                    <Text style={styles.draftTime}>{timeAgo}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.draftActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditDraft(draft.id)}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.actionButtonText}>{editText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handlePublishDraft(draft.id)}
                  >
                    <IconSymbol
                      ios_icon_name="paperplane"
                      android_material_icon_name="send"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.actionButtonText}>{publishText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteDraft(draft.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={18}
                      color={colors.error}
                    />
                    <Text style={[styles.actionButtonText, styles.deleteText]}>{deleteText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  draftCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftContent: {
    padding: 16,
  },
  draftImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  draftTextContainer: {
    gap: 8,
  },
  draftText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  draftMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  draftMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  draftTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  draftActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  deleteText: {
    color: colors.error,
  },
});
