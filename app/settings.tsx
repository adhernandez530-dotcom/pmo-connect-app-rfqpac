
import { useAuth } from "@/contexts/AuthContext";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedFetch, BACKEND_URL, apiGet } from "@/utils/api";
import React, { useState, useEffect } from "react";
import { colors } from "@/styles/commonStyles";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, TextInput, Modal, ActivityIndicator, Linking } from "react-native";
import { Stack, useRouter } from "expo-router";
import { ConfirmModal } from "@/components/ConfirmModal";

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
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  settingItemSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerItem: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  dangerText: {
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.card,
  },
  modalButtonConfirm: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
  oauthDebugSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  oauthDebugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  oauthProviderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  oauthProviderName: {
    fontSize: 14,
    color: colors.text,
    textTransform: 'capitalize',
  },
  oauthStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  oauthStatusConfigured: {
    backgroundColor: 'rgba(0, 217, 163, 0.2)',
  },
  oauthStatusNotConfigured: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  oauthStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  oauthStatusTextConfigured: {
    color: colors.primary,
  },
  oauthStatusTextNotConfigured: {
    color: colors.error,
  },
  oauthSetupButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  oauthSetupButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
});

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);

  useEffect(() => {
    console.log('SettingsScreen: Loading OAuth status');
    loadOAuthStatus();
  }, []);

  const loadOAuthStatus = async () => {
    try {
      const config = await apiGet<OAuthConfig>('/api/oauth/config');
      console.log('SettingsScreen: OAuth config loaded:', config);
      setOauthConfig(config);
    } catch (error) {
      console.error('SettingsScreen: Error loading OAuth status:', error);
    }
  };

  const handleLogout = async () => {
    console.log('SettingsScreen: User confirmed sign out');
    setShowSignOutConfirm(false);
    try {
      await signOut();
      console.log('SettingsScreen: Sign out successful, redirecting to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('SettingsScreen: Sign out error:', error);
    }
  };

  const handleRequestVerificationCode = async () => {
    console.log('SettingsScreen: User requested deactivation verification code');
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/account/request-deactivation-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        console.log('SettingsScreen: Verification code sent successfully');
        setShowDeactivateModal(true);
      } else {
        console.error('SettingsScreen: Failed to send verification code');
      }
    } catch (error) {
      console.error('SettingsScreen: Error requesting verification code:', error);
    }
  };

  const handleVerifyAndDeactivate = async () => {
    console.log('SettingsScreen: User submitted verification code');
    setIsVerifying(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/account/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        console.log('SettingsScreen: Account deactivated successfully');
        setShowDeactivateModal(false);
        await signOut();
        router.replace('/auth');
      } else {
        console.error('SettingsScreen: Invalid verification code');
      }
    } catch (error) {
      console.error('SettingsScreen: Error deactivating account:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeactivateAccount = () => {
    console.log('SettingsScreen: User tapped Deactivate Account');
    handleRequestVerificationCode();
  };

  const handlePrivacyPolicy = () => {
    console.log('SettingsScreen: User tapped Privacy Policy');
    router.push('/privacy-policy');
  };

  const handleTermsOfService = () => {
    console.log('SettingsScreen: User tapped Terms of Service');
    router.push('/terms-of-service');
  };

  const handleNotificationSettings = () => {
    console.log('SettingsScreen: User tapped Notification Settings');
    router.push('/notification-settings');
  };

  const handlePermissionsSettings = () => {
    console.log('SettingsScreen: User tapped Permissions Settings');
    router.push('/permissions-settings');
  };

  const handlePrivacySettings = () => {
    console.log('SettingsScreen: User tapped Privacy Settings');
    router.push('/privacy-settings');
  };

  const handleOpenSetupGuide = (provider: "google" | "apple") => {
    console.log('SettingsScreen: User tapped OAuth setup guide for', provider);
    const url = provider === "google"
      ? "https://console.cloud.google.com/apis/credentials"
      : "https://developer.apple.com/account/resources/identifiers/list";
    Linking.openURL(url);
  };

  const signOutConfirmTitle = "Sign Out";
  const signOutConfirmMessage = "Are you sure you want to sign out?";

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.settingItemText}>Privacy Settings</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleNotificationSettings}>
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="bell.fill"
                  android_material_icon_name="notifications"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.settingItemText}>Notification Settings</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handlePermissionsSettings}>
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="checkmark.shield.fill"
                  android_material_icon_name="verified-user"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.settingItemText}>Permissions</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/blocked-users')}>
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="hand.raised.fill"
                  android_material_icon_name="block"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.settingItemText}>Blocked Users</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.settingItemText}>Privacy Policy</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.settingItemText}>Terms of Service</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {__DEV__ && oauthConfig && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Developer Tools</Text>
              <View style={styles.oauthDebugSection}>
                <Text style={styles.oauthDebugTitle}>OAuth Configuration Status</Text>
                {Object.entries(oauthConfig).map(([provider, config]) => (
                  <View key={provider}>
                    <View style={styles.oauthProviderRow}>
                      <Text style={styles.oauthProviderName}>{provider}</Text>
                      <View
                        style={[
                          styles.oauthStatusBadge,
                          config.configured
                            ? styles.oauthStatusConfigured
                            : styles.oauthStatusNotConfigured,
                        ]}
                      >
                        <Text
                          style={[
                            styles.oauthStatusText,
                            config.configured
                              ? styles.oauthStatusTextConfigured
                              : styles.oauthStatusTextNotConfigured,
                          ]}
                        >
                          {config.configured ? 'Configured' : 'Not Configured'}
                        </Text>
                      </View>
                    </View>
                    {!config.configured && (
                      <TouchableOpacity
                        style={styles.oauthSetupButton}
                        onPress={() => handleOpenSetupGuide(provider as "google" | "apple")}
                      >
                        <Text style={styles.oauthSetupButtonText}>Setup Guide</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => setShowSignOutConfirm(true)}
            >
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="arrow.right.square.fill"
                  android_material_icon_name="logout"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.settingItemText}>Sign Out</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleDeactivateAccount}>
              <View style={styles.settingItemLeft}>
                <IconSymbol
                  ios_icon_name="trash.fill"
                  android_material_icon_name="delete"
                  size={20}
                  color={colors.error}
                />
                <View>
                  <Text style={[styles.settingItemText, styles.dangerText]}>Deactivate Account</Text>
                  <Text style={styles.settingItemSubtext}>This action is permanent</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ConfirmModal
          visible={showSignOutConfirm}
          title={signOutConfirmTitle}
          message={signOutConfirmMessage}
          confirmText="Sign Out"
          cancelText="Cancel"
          destructive
          onConfirm={handleLogout}
          onCancel={() => setShowSignOutConfirm(false)}
        />

        <Modal
          visible={showDeactivateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeactivateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Deactivate Account</Text>
              <Text style={styles.modalText}>
                We've sent a verification code to your email. Please enter it below to confirm account deactivation.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter verification code"
                placeholderTextColor={colors.textSecondary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowDeactivateModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleVerifyAndDeactivate}
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                      Deactivate
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
