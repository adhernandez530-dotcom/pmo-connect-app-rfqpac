
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  ImageSourcePropType,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch } from "@/utils/api";

const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  "https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev";

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
}

interface Friend {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAddFriendsModal, setShowAddFriendsModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCurrentUser = React.useCallback(async () => {
    console.log("ChatScreen: Fetching current user");
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/users/me`);
      if (response.ok) {
        const data = await response.json();
        console.log("ChatScreen: Current user loaded:", data.id);
        setCurrentUserId(data.id);
      }
    } catch (error) {
      console.error("ChatScreen: Error loading current user:", error);
    }
  }, []);

  const loadOtherUserProfile = React.useCallback(async () => {
    console.log("ChatScreen: Fetching other user profile");
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
      const data = await response.json();
      console.log("ChatScreen: Other user profile loaded:", data);
      setOtherUser(data);
    } catch (error) {
      console.error("ChatScreen: Error loading other user profile:", error);
      Alert.alert("Error", "Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadMessages = React.useCallback(async () => {
    console.log("ChatScreen: Fetching messages");
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/messages/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("ChatScreen: Messages loaded:", data.length);
        setMessages(Array.isArray(data) ? data : []);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error("ChatScreen: Error loading messages:", error);
    }
  }, [id]);

  useEffect(() => {
    console.log("ChatScreen: Loading chat with user ID:", id);
    loadOtherUserProfile();
    loadCurrentUser();
    loadMessages();
  }, [id, loadOtherUserProfile, loadCurrentUser, loadMessages]);

  const loadFriends = async () => {
    console.log("ChatScreen: Fetching friends list");
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/friends`);
      if (response.ok) {
        const data = await response.json();
        console.log("ChatScreen: Friends loaded:", data.length);
        setFriends(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("ChatScreen: Error loading friends:", error);
    }
  };

  const handleAddFriendsPress = () => {
    console.log("ChatScreen: User tapped Add Friends button");
    setShowAddFriendsModal(true);
    loadFriends();
  };

  const handleAddFriendToConversation = async (friendId: string, friendName: string) => {
    console.log("ChatScreen: Adding friend to conversation:", friendId);
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/messages/group/add-participant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: id,
          participantId: friendId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("ChatScreen: Friend added successfully:", data);
        Alert.alert("Success", `${friendName} has been added to the conversation`);
        setShowAddFriendsModal(false);
      } else {
        const errorData = await response.json();
        console.error("ChatScreen: Error adding friend:", errorData);
        Alert.alert("Error", errorData.message || "Failed to add friend to conversation");
      }
    } catch (error) {
      console.error("ChatScreen: Error adding friend to conversation:", error);
      Alert.alert("Error", "Failed to add friend to conversation");
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) {
      console.log("ChatScreen: Empty message, not sending");
      return;
    }

    console.log("ChatScreen: User tapped Send button");
    setIsSending(true);

    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: id,
          content: trimmedMessage,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        console.log("ChatScreen: Message sent successfully");
        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const errorData = await response.json();
        console.error("ChatScreen: Error sending message:", errorData);
        Alert.alert("Error", errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("ChatScreen: Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return firstInitial + lastInitial;
  };

  const filteredFriends = friends.filter(friend => 
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !otherUser) {
    const loadingText = "Loading...";
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Chat",
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: otherUser.fullName,
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleAddFriendsPress} style={styles.headerButton}>
              <IconSymbol
                ios_icon_name="person.badge.plus"
                android_material_icon_name="person-add"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="message"
              android_material_icon_name="message"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        ) : (
          <>
            {messages.map((message, index) => {
              const isMyMessage = message.senderId === currentUserId;
              const timeText = formatTime(message.createdAt);

              return (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isMyMessage ? styles.myMessageText : styles.theirMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
                    ]}
                  >
                    {timeText}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || isSending}
        >
          <IconSymbol
            ios_icon_name="arrow.up.circle.fill"
            android_material_icon_name="send"
            size={32}
            color={messageText.trim() ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddFriendsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddFriendsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Friends to Conversation</Text>
            <TouchableOpacity onPress={() => setShowAddFriendsModal(false)}>
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
              placeholder="Search friends..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
            {filteredFriends.length === 0 ? (
              <View style={styles.emptyFriends}>
                <Text style={styles.emptyFriendsText}>No friends found</Text>
              </View>
            ) : (
              <>
                {filteredFriends.map((friend, index) => {
                  const initials = getInitials(friend.fullName);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.friendItem}
                      onPress={() => handleAddFriendToConversation(friend.id, friend.fullName)}
                    >
                      {friend.avatarUrl ? (
                        <Image source={resolveImageSource(friend.avatarUrl)} style={styles.friendAvatar} />
                      ) : (
                        <View style={styles.friendAvatarPlaceholder}>
                          <Text style={styles.friendAvatarText}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.fullName}</Text>
                        <Text style={styles.friendUsername}>@{friend.username}</Text>
                      </View>
                      <IconSymbol
                        ios_icon_name="plus.circle.fill"
                        android_material_icon_name="add-circle"
                        size={28}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    marginRight: 8,
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.backgroundAlt,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.background,
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: colors.background,
    opacity: 0.7,
  },
  theirMessageTime: {
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyFriends: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyFriendsText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
