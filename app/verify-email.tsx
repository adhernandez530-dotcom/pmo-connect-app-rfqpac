
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Stack, useRouter } from "expo-router";

export default function VerifyEmailScreen() {
  const { user, resendVerificationEmail, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleResendEmail = async () => {
    console.log("User tapped resend verification email");
    setLoading(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        "Email Sent",
        "We've sent a new verification link to your email.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("Resend verification error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to resend verification email. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("User tapped logout from verify email screen");
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const emailDisplay = user?.email || "your email";
  const titleText = "Verify Your Email";
  const messageText = `We've sent a verification link to ${emailDisplay}. Please verify your email to continue.`;
  const instructionText = "Check your inbox and click the verification link to activate your account.";
  const resendButtonText = "Resend Verification Email";
  const logoutButtonText = "Log Out";

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          title: "Email Verification",
          headerShown: true,
          headerBackVisible: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>✉️</Text>
          </View>

          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.message}>{messageText}</Text>
          <Text style={styles.instruction}>{instructionText}</Text>

          <TouchableOpacity
            style={[styles.resendButton, loading && styles.buttonDisabled]}
            onPress={handleResendEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.resendButtonText}>{resendButtonText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={styles.logoutButtonText}>{logoutButtonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#000",
  },
  message: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
    lineHeight: 24,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
  },
  resendButton: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  resendButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    height: 50,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});
