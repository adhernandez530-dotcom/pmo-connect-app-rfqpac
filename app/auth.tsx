
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, ScrollView } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
import { useRouter } from "expo-router";
import { useState } from "react";
import { IconSymbol } from "@/components/IconSymbol";
import React from "react";

export default function WelcomeScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupProvider, setSetupProvider] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    console.log("WelcomeScreen: User tapped Continue with Google");
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("WelcomeScreen: Google sign in error:", error);
      
      // Show setup modal if OAuth is not configured
      if (error.message?.includes('not yet available') || error.message?.includes('not configured')) {
        setSetupProvider('google');
        setShowSetupModal(true);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log("WelcomeScreen: User tapped Continue with Apple");
    setIsAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      console.error("WelcomeScreen: Apple sign in error:", error);
      
      // Show setup modal if OAuth is not configured
      if (error.message?.includes('not yet available') || error.message?.includes('not configured')) {
        setSetupProvider('apple');
        setShowSetupModal(true);
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    console.log("WelcomeScreen: User tapped Sign up with Email");
    router.push("/email-signup");
  };

  const handleEmailSignIn = () => {
    console.log("WelcomeScreen: User tapped Sign in with Email");
    router.push("/email-signin");
  };

  const googleButtonText = isGoogleLoading ? "Signing in..." : "Continue with Google";
  const appleButtonText = isAppleLoading ? "Signing in..." : "Continue with Apple";

  const providerName = setupProvider === 'google' ? 'Google' : setupProvider === 'apple' ? 'Apple' : '';

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

      {/* Firebase Setup Modal */}
      <Modal
        visible={showSetupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <IconSymbol 
                ios_icon_name="exclamationmark.triangle.fill" 
                android_material_icon_name="warning" 
                size={32} 
                color={colors.primary} 
              />
              <Text style={styles.modalTitle}>{providerName} Sign In Setup Required</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                To enable {providerName} sign in, you need to configure Firebase Authentication:
              </Text>

              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>1. Firebase Console Setup</Text>
                <Text style={styles.stepText}>
                  • Go to Firebase Console (console.firebase.google.com)
                </Text>
                <Text style={styles.stepText}>
                  • Select your project or create a new one
                </Text>
                <Text style={styles.stepText}>
                  • Navigate to Authentication → Sign-in method
                </Text>
                <Text style={styles.stepText}>
                  • Enable {providerName} as a sign-in provider
                </Text>
              </View>

              {setupProvider === 'google' && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>2. Google OAuth Setup</Text>
                  <Text style={styles.stepText}>
                    • Create OAuth 2.0 credentials in Google Cloud Console
                  </Text>
                  <Text style={styles.stepText}>
                    • Add authorized domains in Firebase
                  </Text>
                  <Text style={styles.stepText}>
                    • Configure OAuth consent screen
                  </Text>
                </View>
              )}

              {setupProvider === 'apple' && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>2. Apple Sign In Setup</Text>
                  <Text style={styles.stepText}>
                    • Enable Sign in with Apple in Apple Developer Portal
                  </Text>
                  <Text style={styles.stepText}>
                    • Configure Service ID and Key
                  </Text>
                  <Text style={styles.stepText}>
                    • Add configuration to Firebase
                  </Text>
                </View>
              )}

              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>3. Update app.json</Text>
                <Text style={styles.stepText}>
                  Add your Firebase configuration to app.json:
                </Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    "extra": {'{'}
                  </Text>
                  <Text style={styles.codeText}>
                    {"  "}firebaseApiKey: "YOUR_API_KEY",
                  </Text>
                  <Text style={styles.codeText}>
                    {"  "}firebaseProjectId: "YOUR_PROJECT_ID",
                  </Text>
                  <Text style={styles.codeText}>
                    {"  "}...
                  </Text>
                  <Text style={styles.codeText}>
                    {'}'}
                  </Text>
                </View>
              </View>

              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>4. Rebuild the App</Text>
                <Text style={styles.stepText}>
                  After configuration, rebuild your app to apply changes.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowSetupModal(false)}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    lineHeight: 24,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    paddingLeft: 8,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
