
import React, { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, signInWithGitHub, loading: authLoading } =
    useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    const loadingText = "Loading...";
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  const handleEmailAuth = async () => {
    console.log("User tapped email auth button - mode:", mode);
    
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        console.log("User signing in with email:", email);
        await signInWithEmail(email, password);
        console.log("Sign in successful - root layout will handle navigation");
      } else {
        console.log("User signing up with email:", email, "name:", name || "(none)");
        await signUpWithEmail(email, password, name || undefined);
        console.log("Sign up successful - root layout will redirect to onboarding");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      const errorMessage = error.message || error.toString() || "Authentication failed";
      
      // Show user-friendly error message
      Alert.alert(
        "Authentication Error", 
        errorMessage,
        [
          {
            text: "OK",
            onPress: () => console.log("User dismissed auth error alert")
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple" | "github") => {
    console.log("User tapped social auth button - provider:", provider);
    setLoading(true);
    try {
      console.log("Starting", provider, "sign in flow");
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "apple") {
        await signInWithApple();
      } else if (provider === "github") {
        await signInWithGitHub();
      }
      console.log("Social auth successful - root layout will handle navigation");
    } catch (error: any) {
      console.error("Social auth error:", error);
      const errorMessage = error.message || error.toString() || "Authentication failed";
      
      // Only show alert if there's an actual error (not user cancellation)
      if (!errorMessage.includes("cancelled") && !errorMessage.includes("canceled")) {
        Alert.alert(
          "Authentication Error", 
          errorMessage,
          [
            {
              text: "OK",
              onPress: () => console.log("User dismissed social auth error alert")
            }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    console.log("User tapped switch mode button - current mode:", mode);
    const newMode = mode === "signin" ? "signup" : "signin";
    setMode(newMode);
    console.log("Switched to mode:", newMode);
  };

  const titleText = mode === "signin" ? "Welcome Back" : "Create Account";
  const subtitleText = mode === "signin" 
    ? "Sign in to continue" 
    : "Sign up to get started";
  const primaryButtonText = mode === "signin" ? "Sign In" : "Sign Up";
  const switchModeText = mode === "signin"
    ? "Don't have an account? Sign Up"
    : "Already have an account? Sign In";
  const dividerText = "or continue with";
  const googleButtonText = "Continue with Google";
  const appleButtonText = "Continue with Apple";
  
  // Log authentication state for debugging
  console.log("AuthScreen: Rendering auth screen - mode:", mode, "loading:", loading);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Name (optional)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={handleSwitchMode}
            disabled={loading}
          >
            <Text style={styles.switchModeText}>{switchModeText}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{dividerText}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, loading && styles.buttonDisabled]}
            onPress={() => handleSocialAuth("google")}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>{googleButtonText}</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
              onPress={() => handleSocialAuth("apple")}
              disabled={loading}
            >
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                {appleButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
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
  switchModeButton: {
    marginTop: 16,
    padding: 8,
    alignItems: "center",
  },
  switchModeText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#666",
    fontSize: 14,
  },
  socialButton: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  socialButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  appleButton: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  appleButtonText: {
    color: "#fff",
  },
});
