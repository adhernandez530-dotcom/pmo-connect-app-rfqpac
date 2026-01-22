
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, ImageSourcePropType, Modal } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Conversation {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  mutualFriends?: number;
  archived: boolean;
  muted: boolean;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ visible: boolean; conversation: Conversation | null }>({
    visible: false,
    conversation: null,
  });

  const loadConversations = useCallback(async () => {
    try {
      console.log('MessagesScreen: Fetching conversations from backend');
      const endpoint = showArchived
        ? `${BACKEND_URL}/api/messages/archived`
        : `${BACKEND_URL}/api/messages/conversations`;
      const response = await fetch(endpoint);
      const data = await response.json();
      console.log('MessagesScreen: Conversations loaded successfully', data);
      
      // Validate that data is an array before setting state
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.log('MessagesScreen: API returned non-array data:', data);
        setConversations([]);
      }
    } catch (error) {
      console.error('MessagesScreen: Error loading conversations:', error);
      setConversations([]);
    }
  }, [showArchived]);

  useEffect(() => {
    console.log('MessagesScreen: Loading conversations');
    loadConversations();
  }, [showArchived, loadConversations]);

  const handleMarkRead = async (userId: string) => {
    console.log('MessagesScreen: Marking conversation as read:', userId);
    try {
      await fetch(`${BACKEND_URL}/api/messages/${userId}/read`, {
        method: 'PUT',
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error marking as read:', error);
    }
  };

  const handleMarkUnread = async (userId: string) => {
    console.log('MessagesScreen: Marking conversation as unread:', userId);
    try {
      await fetch(`${BACKEND_URL}/api/messages/${userId}/unread`, {
        method: 'PUT',
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error marking as unread:', error);
    }
  };

  const handleMute = async (userId: string) => {
    console.log('MessagesScreen: Muting conversation:', userId);
    try {
      await fetch(`${BACKEND_URL}/api/messages/${userId}/mute`, {
        method: 'PUT',
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error muting conversation:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    console.log('MessagesScreen: Deleting conversation:', userId);
    try {
      await fetch(`${BACKEND_URL}/api/messages/${userId}`, { method: 'DELETE' });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error deleting conversation:', error);
    }
  };

  const handleArchive = async (userId: string) => {
    console.log('MessagesScreen: Archiving conversation:', userId);
    try {
      await fetch(`${BACKEND_URL}/api/messages/${userId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error archiving conversation:', error);
    }
  };

  const handleLongPress = (conversation: Conversation) => {
    console.log('MessagesScreen: User long-pressed conversation:', conversation.userId);
    setPreviewModal({ visible: true, conversation });
  };

  const handleConversationPress = (userId: string) => {
    console.log('MessagesScreen: User tapped conversation:', userId);
    // TODO: Navigate to chat screen
    // router.push(`/chat/${userId}`);
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const archiveButtonText = showArchived ? 'Back to Messages' : 'Archived';
  const mutualFriendsText = 'mutual friends';
  const noConversationsText = 'No conversations yet';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => setShowArchived(!showArchived)}>
          <IconSymbol
            ios_icon_name="archivebox"
            android_material_icon_name="archive"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="message.slash"
              android_material_icon_name="message"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>{noConversationsText}</Text>
          </View>
        ) : (
          <React.Fragment>
            {conversations.map((conversation, index) => {
              const initials = getInitials(conversation.fullName);
              const mutualFriendsDisplay = conversation.mutualFriends
                ? `${conversation.mutualFriends} ${mutualFriendsText}`
                : '';

              return (
                <SwipeableConversation
                  key={index}
                  conversation={conversation}
                  onPress={() => handleConversationPress(conversation.userId)}
                  onLongPress={() => handleLongPress(conversation)}
                  onMarkRead={() => handleMarkRead(conversation.userId)}
                  onMarkUnread={() => handleMarkUnread(conversation.userId)}
                  onMute={() => handleMute(conversation.userId)}
                  onDelete={() => handleDelete(conversation.userId)}
                  onArchive={() => handleArchive(conversation.userId)}
                >
                  <View style={styles.conversationCard}>
                    <View style={styles.conversationContent}>
                      {conversation.avatarUrl ? (
                        <Image source={resolveImageSource(conversation.avatarUrl)} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.conversationDetails}>
                        <View style={styles.conversationHeader}>
                          <Text style={styles.fullName}>{conversation.fullName}</Text>
                          {conversation.unread && <View style={styles.unreadDot} />}
                          {conversation.muted && (
                            <IconSymbol
                              ios_icon_name="bell.slash.fill"
                              android_material_icon_name="notifications-off"
                              size={14}
                              color={colors.textSecondary}
                            />
                          )}
                        </View>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                          {conversation.lastMessage}
                        </Text>
                        {mutualFriendsDisplay && (
                          <Text style={styles.mutualFriends}>{mutualFriendsDisplay}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </SwipeableConversation>
              );
            })}
          </React.Fragment>
        )}
      </ScrollView>

      <Modal
        visible={previewModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModal({ visible: false, conversation: null })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreviewModal({ visible: false, conversation: null })}
        >
          {previewModal.conversation && (
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                {previewModal.conversation.avatarUrl ? (
                  <Image
                    source={resolveImageSource(previewModal.conversation.avatarUrl)}
                    style={styles.previewAvatar}
                  />
                ) : (
                  <View style={styles.previewAvatarPlaceholder}>
                    <Text style={styles.previewAvatarText}>
                      {getInitials(previewModal.conversation.fullName)}
                    </Text>
                  </View>
                )}
                <Text style={styles.previewName}>{previewModal.conversation.fullName}</Text>
              </View>
              <Text style={styles.previewMessage}>{previewModal.conversation.lastMessage}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

interface SwipeableConversationProps {
  conversation: Conversation;
  onPress: () => void;
  onLongPress: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onMute: () => void;
  onDelete: () => void;
  onArchive: () => void;
  children: React.ReactNode;
}

function SwipeableConversation({
  conversation,
  onPress,
  onLongPress,
  onMarkRead,
  onMarkUnread,
  onMute,
  onDelete,
  onArchive,
  children,
}: SwipeableConversationProps) {
  const translateX = useSharedValue(0);
  const [showLeftActions, setShowLeftActions] = useState(false);
  const [showRightActions, setShowRightActions] = useState(false);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      setShowLeftActions(e.translationX > 80);
      setShowRightActions(e.translationX < -80);
    })
    .onEnd(() => {
      if (translateX.value > 80) {
        if (conversation.unread) {
          onMarkRead();
        } else {
          onMarkUnread();
        }
      } else if (translateX.value < -80) {
        onMute();
      }
      translateX.value = withTiming(0);
      setShowLeftActions(false);
      setShowRightActions(false);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.swipeableContainer}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
          >
            {children}
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
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
  scrollView: {
    flex: 1,
  },
  swipeableContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  conversationCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  conversationDetails: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  mutualFriends: {
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  previewAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  previewName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  previewMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
