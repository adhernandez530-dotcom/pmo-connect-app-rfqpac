
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function WelcomeScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    console.log("WelcomeScreen: User tapped Continue with Google");
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("WelcomeScreen: Google sign in error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log("WelcomeScreen: User tapped Continue with Apple");
    setIsAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.error("WelcomeScreen: Apple sign in error:", error);
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    console.log("WelcomeScreen: User tapped Sign up with Email");
    // TODO: Create email sign up screen at app/email-signup.tsx
    // For now, show a message
    console.log("WelcomeScreen: Email sign up not yet implemented");
  };

  const handleEmailSignIn = () => {
    console.log("WelcomeScreen: User tapped Sign in with Email");
    // TODO: Create email sign in screen at app/email-signin.tsx
    // For now, show a message
    console.log("WelcomeScreen: Email sign in not yet implemented");
  };

  const googleButtonText = isGoogleLoading ? "Signing in..." : "Continue with Google";
  const appleButtonText = isAppleLoading ? "Signing in..." : "Continue with Apple";

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PutMeOn</Text>

      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Discover what your friends are into.
      </Text>

      <TouchableOpacity 
        style={[styles.primaryButton, isGoogleLoading && styles.buttonDisabled]} 
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading || isAppleLoading}
      >
        <Text style={styles.primaryText}>{googleButtonText}</Text>
      </TouchableOpacity>

      {Platform.OS === "ios" && (
        <TouchableOpacity 
          style={[styles.appleButton, isAppleLoading && styles.buttonDisabled]} 
          onPress={handleAppleSignIn}
          disabled={isGoogleLoading || isAppleLoading}
        >
          <Text style={styles.appleText}>{appleButtonText}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.divider}>or</Text>

      <TouchableOpacity onPress={handleEmailSignUp}>
        <Text style={styles.link}>Sign up with Email</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleEmailSignIn}>
        <Text style={styles.linkSecondary}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 48,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  appleButton: {
    width: "100%",
    backgroundColor: "#000000",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  appleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    fontSize: 14,
    color: colors.textSecondary,
    marginVertical: 24,
  },
  link: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 16,
  },
  linkSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
