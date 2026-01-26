
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, ImageSourcePropType, Modal, Dimensions } from "react-native";
import { authenticatedFetch, BACKEND_URL } from "@/utils/api";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import React, { useState, useEffect, useCallback } from "react";
import { IconSymbol } from "@/components/IconSymbol";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      console.log('MessagesScreen: Fetching conversations');
      const response = await authenticatedFetch(`${BACKEND_URL}/api/messages/conversations${showArchived ? '?archived=true' : ''}`);
      const data = await response.json();
      console.log('MessagesScreen: Conversations loaded:', data);
      setConversations(data);
    } catch (error) {
      console.error('MessagesScreen: Error loading conversations:', error);
    }
  }, [showArchived]);

  useEffect(() => {
    console.log('MessagesScreen: Loading conversations, showArchived:', showArchived);
    loadConversations();
  }, [showArchived, loadConversations]);

  const handleMarkRead = useCallback(async (userId: string) => {
    console.log('MessagesScreen: Marking conversation as read:', userId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/messages/conversations/${userId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error marking as read:', error);
    }
  }, [loadConversations]);

  const handleMarkUnread = useCallback(async (userId: string) => {
    console.log('MessagesScreen: Marking conversation as unread:', userId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/messages/conversations/${userId}/unread`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error marking as unread:', error);
    }
  }, [loadConversations]);

  const handleMute = useCallback(async (userId: string) => {
    console.log('MessagesScreen: Toggling mute for conversation:', userId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/messages/conversations/${userId}/mute`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error toggling mute:', error);
    }
  }, [loadConversations]);

  const handleDelete = useCallback(async (userId: string) => {
    console.log('MessagesScreen: Deleting conversation:', userId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/messages/conversations/${userId}`, {
        method: 'DELETE'
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error deleting conversation:', error);
    }
  }, [loadConversations]);

  const handleArchive = useCallback(async (userId: string) => {
    console.log('MessagesScreen: Archiving conversation:', userId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/messages/conversations/${userId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      loadConversations();
    } catch (error) {
      console.error('MessagesScreen: Error archiving conversation:', error);
    }
  }, [loadConversations]);

  const handleLongPress = (conversation: Conversation) => {
    console.log('MessagesScreen: Long press on conversation:', conversation.userId);
    setSelectedConversation(conversation);
    setShowActionModal(true);
  };

  const handleConversationPress = (userId: string) => {
    console.log('MessagesScreen: User tapped conversation:', userId);
    router.push(`/chat/${userId}`);
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const archivedText = showArchived ? 'Show Active' : 'Show Archived';
  const noConversationsText = showArchived ? 'No archived conversations' : 'No messages yet';
  const noConversationsSubtext = showArchived ? 'Archived conversations will appear here' : 'Start a conversation with your friends';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => setShowArchived(!showArchived)}>
          <Text style={styles.archivedButton}>{archivedText}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="message"
              android_material_icon_name="message"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>{noConversationsText}</Text>
            <Text style={styles.emptyStateSubtext}>{noConversationsSubtext}</Text>
          </View>
        )}

        {conversations.map((conversation, index) => {
          const initials = getInitials(conversation.fullName);
          
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
                  <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.fullName} numberOfLines={1}>{conversation.fullName}</Text>
                      <Text style={styles.time}>{conversation.lastMessageTime}</Text>
                    </View>
                    <View style={styles.messagePreview}>
                      <Text 
                        style={[styles.lastMessage, conversation.unread && styles.unreadMessage]} 
                        numberOfLines={1}
                      >
                        {conversation.lastMessage}
                      </Text>
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
                  </View>
                </View>
              </View>
            </SwipeableConversation>
          );
        })}
      </ScrollView>

      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowActionModal(false)}
        >
          <View style={styles.actionSheet}>
            {selectedConversation && (
              <>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    if (selectedConversation.unread) {
                      handleMarkRead(selectedConversation.userId);
                    } else {
                      handleMarkUnread(selectedConversation.userId);
                    }
                    setShowActionModal(false);
                  }}
                >
                  <IconSymbol
                    ios_icon_name={selectedConversation.unread ? "envelope.open" : "envelope"}
                    android_material_icon_name={selectedConversation.unread ? "mark-email-read" : "mark-email-unread"}
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.actionText}>
                    {selectedConversation.unread ? 'Mark as Read' : 'Mark as Unread'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    handleMute(selectedConversation.userId);
                    setShowActionModal(false);
                  }}
                >
                  <IconSymbol
                    ios_icon_name={selectedConversation.muted ? "bell" : "bell.slash"}
                    android_material_icon_name={selectedConversation.muted ? "notifications" : "notifications-off"}
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.actionText}>
                    {selectedConversation.muted ? 'Unmute' : 'Mute'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    handleArchive(selectedConversation.userId);
                    setShowActionModal(false);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="archivebox"
                    android_material_icon_name="archive"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.actionText}>Archive</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, styles.deleteAction]}
                  onPress={() => {
                    handleDelete(selectedConversation.userId);
                    setShowActionModal(false);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={20}
                    color="#FF3B30"
                  />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function SwipeableConversation({ conversation, onPress, onLongPress, onMarkRead, onMarkUnread, onMute, onDelete, onArchive, children }: SwipeableConversationProps) {
  const translateX = useSharedValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -150);
      }
    })
    .onEnd(() => {
      if (translateX.value < -75) {
        translateX.value = withTiming(-150);
        setIsRevealed(true);
      } else {
        translateX.value = withTiming(0);
        setIsRevealed(false);
      }
    });

  return (
    <View style={styles.swipeableContainer}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.muteButton]} onPress={onMute}>
          <IconSymbol
            ios_icon_name="bell.slash"
            android_material_icon_name="notifications-off"
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <IconSymbol
            ios_icon_name="trash"
            android_material_icon_name="delete"
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
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
  archivedButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
  swipeableContainer: {
    position: 'relative',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 75,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  conversationCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    maxWidth: SCREEN_WIDTH - 24,
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
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 16,
    color: colors.text,
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  deleteText: {
    color: '#FF3B30',
  },
});
