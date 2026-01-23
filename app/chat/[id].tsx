
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
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch } from "@/utils/api";

const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  "https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev";

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

  useEffect(() => {
    console.log("ChatScreen: Loading chat with user ID:", id);
    loadOtherUserProfile();
    loadCurrentUser();
    loadMessages();
  }, [id]);

  const loadCurrentUser = async () => {
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
  };

  const loadOtherUserProfile = async () => {
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
  };

  const loadMessages = async () => {
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

  if (isLoading || !otherUser) {
    const loadingText = "Loading...";
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Chat",
            headerBackTitle: "Back",
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
    </KeyboardAvoidingView>
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
});
