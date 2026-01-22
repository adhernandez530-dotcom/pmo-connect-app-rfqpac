
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from "react-native";
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
      const response = await fetch(`${BACKEND_URL}/api/feed?sort=${sortBy}`);
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
        await fetch(`${BACKEND_URL}/api/posts/${postId}/like`, { method: 'DELETE' });
      } else {
        await fetch(`${BACKEND_URL}/api/posts/${postId}/like`, { method: 'POST', body: JSON.stringify({}) });
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
      await fetch(`${BACKEND_URL}/api/posts/${postId}/repost`, {
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
    <>
      <Stack.Screen options={{ title: 'Feed', headerLargeTitle: true }} />
      <View style={styles.container}>
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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {posts.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="newspaper"
                android_material_icon_name="article"
                size={64}
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
                      size={14}
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
                      <Text style={styles.fullName}>{post.fullName}</Text>
                      <Text style={styles.username}>@{post.username}</Text>
                    </View>
                  </View>
                </View>

                {post.mediaUrl && (
                  <Image source={resolveImageSource(post.mediaUrl)} style={styles.postMedia} />
                )}

                {post.content && (
                  <Text style={styles.postContent}>{post.content}</Text>
                )}

                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                    <IconSymbol
                      ios_icon_name={post.isLiked ? "heart.fill" : "heart"}
                      android_material_icon_name={post.isLiked ? "favorite" : "favorite-border"}
                      size={20}
                      color={post.isLiked ? colors.primary : colors.textSecondary}
                    />
                    <Text style={styles.actionText}>{likesCountText}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(post.id)}>
                    <IconSymbol
                      ios_icon_name="bubble.left"
                      android_material_icon_name="chat-bubble-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.actionText}>{commentsCountText}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => handleRepost(post.id)}>
                    <IconSymbol
                      ios_icon_name="arrow.2.squarepath"
                      android_material_icon_name="repeat"
                      size={20}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sortButtonTextActive: {
    color: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  repostText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
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
  },
  postMedia: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  postContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
