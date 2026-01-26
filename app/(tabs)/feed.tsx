
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, ImageSourcePropType, Dimensions, Alert, Modal, TextInput } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch, BACKEND_URL } from "@/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Post {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  isLiked: boolean;
  isReposted: boolean;
  repostOf?: {
    username: string;
    fullName: string;
  };
  createdAt: string;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popularity'>('recent');
  const [loading, setLoading] = useState(true);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      console.log('FeedScreen: Fetching feed from backend');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/feed?sort=${sortBy}`);
      if (!response.ok) {
        console.log('FeedScreen: API returned error status:', response.status);
        setPosts([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      console.log('FeedScreen: Feed response received:', data);
      
      if (Array.isArray(data)) {
        console.log('FeedScreen: Feed loaded successfully with', data.length, 'posts');
        setPosts(data);
      } else {
        console.log('FeedScreen: API returned non-array data (likely error):', data);
        setPosts([]);
      }
    } catch (error) {
      console.error('FeedScreen: Error loading feed:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    console.log('FeedScreen: Loading feed with sort:', sortBy);
    loadFeed();
  }, [sortBy, loadFeed]);

  const handleLike = async (postId: string) => {
    console.log('FeedScreen: User tapped like on post:', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        await authenticatedFetch(`${BACKEND_URL}/api/posts/${postId}/like`, { method: 'DELETE' });
      } else {
        await authenticatedFetch(`${BACKEND_URL}/api/posts/${postId}/like`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) 
        });
      }
      loadFeed();
    } catch (error) {
      console.error('FeedScreen: Error toggling like:', error);
    }
  };

  const handleComment = (postId: string) => {
    console.log('FeedScreen: User tapped comment on post:', postId);
    // TODO: Navigate to comments screen
  };

  const handleRepost = async (postId: string) => {
    console.log('FeedScreen: User tapped repost on post:', postId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/posts/${postId}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      loadFeed();
    } catch (error) {
      console.error('FeedScreen: Error reposting:', error);
    }
  };

  const handleReportPost = (postId: string) => {
    console.log('FeedScreen: User tapped report on post:', postId);
    setReportingPostId(postId);
    setShowPostMenu(null);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert("Error", "Please provide a reason for reporting");
      return;
    }

    if (!reportingPostId) return;

    console.log('FeedScreen: Submitting report for post:', reportingPostId);
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/posts/${reportingPostId}/report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reportReason })
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Post has been reported");
        setShowReportModal(false);
        setReportReason("");
        setReportingPostId(null);
      } else {
        throw new Error("Failed to report post");
      }
    } catch (error) {
      console.error('FeedScreen: Error reporting post:', error);
      Alert.alert("Error", "Failed to report post");
    }
  };

  const handleBlockUser = (userId: string, username: string) => {
    console.log('FeedScreen: User tapped block on user:', username);
    setShowPostMenu(null);
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${username}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            console.log('FeedScreen: Blocking user:', userId);
            try {
              const response = await authenticatedFetch(
                `${BACKEND_URL}/api/users/${userId}/block`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({})
                }
              );

              if (response.ok) {
                Alert.alert("Success", `${username} has been blocked`);
                // Remove posts from this user from the feed
                setPosts(posts.filter(p => p.userId !== userId));
              } else {
                throw new Error("Failed to block user");
              }
            } catch (error) {
              console.error('FeedScreen: Error blocking user:', error);
              Alert.alert("Error", "Failed to block user");
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const recentText = 'Recent';
  const popularityText = 'Popularity';
  const noPostsText = 'No posts yet';
  const noPostsSubtext = 'Follow friends to see their posts here';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.sortButtonTextActive]}>
            {recentText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'popularity' && styles.sortButtonActive]}
          onPress={() => setSortBy('popularity')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'popularity' && styles.sortButtonTextActive]}>
            {popularityText}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        onScroll={() => setShowPostMenu(null)}
        scrollEventThrottle={16}
      >
        {posts.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="newspaper"
              android_material_icon_name="article"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>{noPostsText}</Text>
            <Text style={styles.emptyStateSubtext}>{noPostsSubtext}</Text>
          </View>
        )}

        {posts.map((post, index) => {
          const initials = getInitials(post.fullName);
          const likesCountText = `${post.likesCount}`;
          const commentsCountText = `${post.commentsCount}`;
          const repostsCountText = `${post.repostsCount}`;
          const repostInfo = post.repostOf ? `Reposted by ${post.repostOf.fullName}` : '';
          const isMenuOpen = showPostMenu === post.id;

          return (
            <View key={index} style={styles.postCard}>
              {post.repostOf && (
                <View style={styles.repostBanner}>
                  <IconSymbol
                    ios_icon_name="arrow.2.squarepath"
                    android_material_icon_name="repeat"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.repostText}>{repostInfo}</Text>
                </View>
              )}

              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  {post.avatarUrl ? (
                    <Image source={resolveImageSource(post.avatarUrl)} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={styles.fullName} numberOfLines={1}>{post.fullName}</Text>
                    <Text style={styles.username} numberOfLines={1}>@{post.username}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowPostMenu(post.id)}>
                  <IconSymbol
                    ios_icon_name="ellipsis"
                    android_material_icon_name="more-vert"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {post.mediaUrl && (
                <Image source={resolveImageSource(post.mediaUrl)} style={styles.postMedia} resizeMode="cover" />
              )}

              {post.content && (
                <Text style={styles.postContent}>{post.content}</Text>
              )}

              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                  <IconSymbol
                    ios_icon_name={post.isLiked ? "heart.fill" : "heart"}
                    android_material_icon_name={post.isLiked ? "favorite" : "favorite-border"}
                    size={18}
                    color={post.isLiked ? colors.primary : colors.textSecondary}
                  />
                  <Text style={styles.actionText}>{likesCountText}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(post.id)}>
                  <IconSymbol
                    ios_icon_name="bubble.left"
                    android_material_icon_name="chat-bubble-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.actionText}>{commentsCountText}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => handleRepost(post.id)}>
                  <IconSymbol
                    ios_icon_name="arrow.2.squarepath"
                    android_material_icon_name="repeat"
                    size={18}
                    color={post.isReposted ? colors.primary : colors.textSecondary}
                  />
                  <Text style={styles.actionText}>{repostsCountText}</Text>
                </TouchableOpacity>
              </View>

              {isMenuOpen && (
                <View style={styles.postMenu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleReportPost(post.id)}
                  >
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle"
                      android_material_icon_name="report"
                      size={18}
                      color={colors.error}
                    />
                    <Text style={styles.menuItemText}>Report Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleBlockUser(post.userId, post.username)}
                  >
                    <IconSymbol
                      ios_icon_name="hand.raised.fill"
                      android_material_icon_name="block"
                      size={18}
                      color={colors.error}
                    />
                    <Text style={styles.menuItemText}>Block User</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Post</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.reportInput}
              placeholder="Why are you reporting this post?"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={reportReason}
              onChangeText={setReportReason}
              autoFocus
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitReport}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sortButtonTextActive: {
    color: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    maxWidth: SCREEN_WIDTH - 24,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  repostText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  postContent: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postMenu: {
    position: 'absolute',
    top: 40,
    right: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 160,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  reportInput: {
    fontSize: 16,
    color: colors.text,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
