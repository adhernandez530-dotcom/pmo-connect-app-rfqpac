
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, ImageSourcePropType, Dimensions } from "react-native";
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
            </View>
          );
        })}
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
});
