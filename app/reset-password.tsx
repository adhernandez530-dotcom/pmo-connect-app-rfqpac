
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { apiPost } from "@/utils/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    if (!token) {
      console.error("ResetPassword: No token provided");
      Alert.alert(
        "Invalid Link",
        "This password reset link is invalid. Please request a new one.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth"),
          },
        ]
      );
    }
  }, [token, router]);

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (pwd: string, confirmPwd: string): boolean => {
    if (confirmPwd && pwd !== confirmPwd) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    validatePassword(text);
    if (confirmPassword) {
      validateConfirmPassword(text, confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    validateConfirmPassword(password, text);
  };

  const handleResetPassword = async () => {
    console.log("User tapped reset password button");

    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please enter and confirm your new password");
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    if (!validateConfirmPassword(password, confirmPassword)) {
      return;
    }

    setLoading(true);
    try {
      console.log("ResetPassword: Calling backend to reset password");
      await apiPost("/api/auth/reset-password", {
        token,
        newPassword: password,
      });

      console.log("ResetPassword: Password reset successful");
      Alert.alert(
        "Success",
        "Your password has been reset successfully. You can now sign in with your new password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth"),
          },
        ]
      );
    } catch (error: any) {
      console.error("ResetPassword: Error:", error);
      
      let errorMessage = "Failed to reset password. Please try again.";
      
      if (error?.message?.includes("expired") || error?.message?.includes("invalid")) {
        errorMessage = "This password reset link has expired or is invalid. Please request a new one.";
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    password &&
    confirmPassword &&
    password.length >= 6 &&
    password === confirmPassword &&
    !passwordError &&
    !confirmPasswordError;

  const titleText = "Reset Your Password";
  const subtitleText = "Enter your new password below";
  const passwordPlaceholder = "New Password (min 6 characters)";
  const confirmPasswordPlaceholder = "Confirm New Password";
  const resetButtonText = "Reset Password";
  const cancelButtonText = "Cancel";

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          title: "Reset Password",
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>

            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder={passwordPlaceholder}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <TextInput
              style={[
                styles.input,
                confirmPasswordError ? styles.inputError : null,
              ]}
              placeholder={confirmPasswordPlaceholder}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !isFormValid) && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{resetButtonText}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.replace("/auth")}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
    color: "#666",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ff3b30",
    marginBottom: 4,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
    paddingHorizontal: 4,
  },
  primaryButton: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    marginTop: 16,
    padding: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "500",
  },
});
