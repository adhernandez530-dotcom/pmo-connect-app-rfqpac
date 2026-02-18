
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { authenticatedFetch, BACKEND_URL, apiGet } from "@/utils/api";
import { colors } from "@/styles/commonStyles";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, TextInput, Modal, ActivityIndicator, Linking } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";

interface OAuthProvider {
  enabled: boolean;
  configured: boolean;
}

interface OAuthConfig {
  google?: OAuthProvider;
  apple?: OAuthProvider;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  dangerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.border,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextPrimary: {
    color: "#fff",
  },
  modalButtonTextSecondary: {
    color: colors.text,
  },
  oauthStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  oauthConfigured: {
    color: "#34C759",
  },
  oauthNotConfigured: {
    color: "#FF9500",
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useFirebaseAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig>({});

  useEffect(() => {
    loadOAuthStatus();
  }, []);

  const loadOAuthStatus = async () => {
    try {
      const config = await apiGet<OAuthConfig>("/api/oauth/config");
      setOauthConfig(config);
      console.log("OAuth config loaded:", config);
    } catch (error) {
      console.error("Failed to load OAuth config:", error);
    }
  };

  const handleLogout = async () => {
    console.log("User tapped Logout button");
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      console.log("User confirmed logout");
      await signOut();
      console.log("Logout successful, redirecting to firebase-auth");
      router.replace("/firebase-auth");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  const handleRequestVerificationCode = async () => {
    setDeactivateLoading(true);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/account/request-deactivation-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      console.log("Verification code sent");
    } catch (error) {
      console.error("Failed to request verification code:", error);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleVerifyAndDeactivate = async () => {
    if (!verificationCode) {
      return;
    }

    setDeactivateLoading(true);
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/account/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });
      console.log("Account deactivated");
      setShowDeactivateModal(false);
      await signOut();
      router.replace("/firebase-auth");
    } catch (error) {
      console.error("Failed to deactivate account:", error);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDeactivateAccount = () => {
    console.log("User tapped Deactivate Account button");
    setShowDeactivateModal(true);
  };

  const handlePrivacyPolicy = () => {
    console.log("User tapped Privacy Policy");
    router.push("/privacy-policy");
  };

  const handleTermsOfService = () => {
    console.log("User tapped Terms of Service");
    router.push("/terms-of-service");
  };

  const handleNotificationSettings = () => {
    console.log("User tapped Notification Settings");
    router.push("/notification-settings");
  };

  const handlePermissionsSettings = () => {
    console.log("User tapped Permissions Settings");
    router.push("/permissions-settings");
  };

  const handlePrivacySettings = () => {
    console.log("User tapped Privacy Settings");
    router.push("/privacy-settings");
  };

  const handleOpenSetupGuide = (provider: "google" | "apple") => {
    console.log(`User tapped ${provider} setup guide`);
    const url = provider === "google"
      ? "https://firebase.google.com/docs/auth/web/google-signin"
      : "https://firebase.google.com/docs/auth/ios/apple";
    Linking.openURL(url);
  };

  const googleConfigured = oauthConfig.google?.configured;
  const appleConfigured = oauthConfig.apple?.configured;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Settings", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleNotificationSettings}>
            <Text style={styles.settingLabel}>Notification Settings</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
            <Text style={styles.settingLabel}>Privacy Settings</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handlePermissionsSettings}>
            <Text style={styles.settingLabel}>Permissions</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication (Firebase)</Text>
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Google Sign-In</Text>
              <Text style={[styles.oauthStatus, googleConfigured ? styles.oauthConfigured : styles.oauthNotConfigured]}>
                {googleConfigured ? "✓ Configured" : "⚠ Not configured"}
              </Text>
            </View>
            {!googleConfigured && (
              <TouchableOpacity onPress={() => handleOpenSetupGuide("google")}>
                <Text style={{ color: colors.primary }}>Setup Guide</Text>
              </TouchableOpacity>
            )}
          </View>
          {Platform.OS === "ios" && (
            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Apple Sign-In</Text>
                <Text style={[styles.oauthStatus, appleConfigured ? styles.oauthConfigured : styles.oauthNotConfigured]}>
                  {appleConfigured ? "✓ Configured" : "⚠ Not configured"}
                </Text>
              </View>
              {!appleConfigured && (
                <TouchableOpacity onPress={() => handleOpenSetupGuide("apple")}>
                  <Text style={{ color: colors.primary }}>Setup Guide</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Text style={styles.dangerButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeactivateAccount}>
            <Text style={styles.dangerButtonText}>Deactivate Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <Modal visible={showDeactivateModal} transparent animationType="fade" onRequestClose={() => setShowDeactivateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deactivate Account</Text>
            <Text style={styles.modalText}>
              Enter the verification code sent to your email to deactivate your account. This action cannot be undone.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Verification Code"
              placeholderTextColor={colors.textSecondary}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowDeactivateModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleRequestVerificationCode}
                disabled={deactivateLoading}
              >
                {deactivateLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
            {verificationCode.length > 0 && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { marginTop: 12 }]}
                onPress={handleVerifyAndDeactivate}
                disabled={deactivateLoading}
              >
                {deactivateLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Deactivate</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
