
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, TextInput, Modal, ActivityIndicator, Linking } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedFetch, BACKEND_URL, apiGet } from "@/utils/api";

interface OAuthProvider {
  enabled: boolean;
  configured: boolean;
}

interface OAuthConfig {
  google?: OAuthProvider;
  apple?: OAuthProvider;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // OAuth status (only in dev mode)
  const [oauthStatus, setOauthStatus] = useState<OAuthConfig | null>(null);
  const [loadingOAuthStatus, setLoadingOAuthStatus] = useState(false);

  // Load OAuth status in development mode
  useEffect(() => {
    if (__DEV__) {
      loadOAuthStatus();
    }
  }, []);

  const loadOAuthStatus = async () => {
    console.log('SettingsScreen: Loading OAuth status (dev mode)');
    setLoadingOAuthStatus(true);
    try {
      const config = await apiGet('/api/oauth/config');
      console.log('SettingsScreen: OAuth config:', config);
      setOauthStatus(config);
    } catch (error) {
      console.error('SettingsScreen: Failed to load OAuth status:', error);
    } finally {
      setLoadingOAuthStatus(false);
    }
  };

  const handleLogout = () => {
    console.log('SettingsScreen: User tapped Logout button');
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('SettingsScreen: Logout cancelled'),
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            console.log('SettingsScreen: Logging out user');
            setIsLoggingOut(true);
            try {
              // Call backend logout endpoint
              console.log('SettingsScreen: Calling backend logout endpoint');
              try {
                const response = await authenticatedFetch(`${BACKEND_URL}/api/account/logout`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({}),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('SettingsScreen: Backend logout response:', data);
                } else {
                  console.warn('SettingsScreen: Backend logout returned non-OK status:', response.status);
                }
              } catch (backendError) {
                console.warn('SettingsScreen: Backend logout failed, continuing with local logout:', backendError);
              }
              
              // Sign out from auth context (clears local session)
              console.log('SettingsScreen: Clearing local auth session');
              await signOut();
              
              console.log('SettingsScreen: Logout successful, navigating to auth screen');
              // Navigate directly to auth screen
              router.replace('/auth');
            } catch (error) {
              console.error('SettingsScreen: Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleRequestVerificationCode = async () => {
    console.log('SettingsScreen: Requesting verification code for account deactivation');
    setIsRequestingCode(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/account/deactivate/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        console.error('SettingsScreen: Request code failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send verification code');
      }
      
      const data = await response.json();
      console.log('SettingsScreen: Request code response:', data);
      
      Alert.alert('Verification Code Sent', data.message || 'A verification code has been sent to your phone number.');
      setShowVerificationModal(true);
    } catch (error: any) {
      console.error('SettingsScreen: Error requesting verification code:', error);
      Alert.alert('Error', error.message || 'Failed to send verification code. Please ensure you have a phone number on file.');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyAndDeactivate = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit verification code.');
      return;
    }

    console.log('SettingsScreen: Verifying code and deactivating account');
    setIsVerifyingCode(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/account/deactivate/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });
      
      if (!response.ok) {
        console.error('SettingsScreen: Verify code failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid or expired verification code');
      }
      
      const data = await response.json();
      console.log('SettingsScreen: Verify response:', data);
      
      // Close modal
      setShowVerificationModal(false);
      setVerificationCode("");
      
      // Sign out from auth context (clears local session)
      console.log('SettingsScreen: Account deactivated, clearing local session');
      await signOut();
      
      Alert.alert('Account Deactivated', data.message || 'Your account has been deactivated successfully');
      // Navigate to auth screen
      router.replace('/auth');
    } catch (error: any) {
      console.error('SettingsScreen: Error verifying code:', error);
      Alert.alert('Error', error.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleDeactivateAccount = () => {
    console.log('SettingsScreen: User tapped Deactivate Account button');
    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to deactivate your account? A verification code will be sent to your phone number.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('SettingsScreen: Account deactivation cancelled'),
        },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: handleRequestVerificationCode,
        },
      ]
    );
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
    console.log('SettingsScreen: Opening setup guide for:', provider);
    const urls = {
      google: "https://console.cloud.google.com/apis/credentials",
      apple: "https://developer.apple.com/account/resources/identifiers/list/serviceId"
    };
    Linking.openURL(urls[provider]);
  };

  const settingsTitle = 'Settings';
  const accountSectionTitle = 'Account';
  const notificationSettingsText = 'Notification Settings';
  const permissionsSettingsText = 'Permissions';
  const privacySettingsText = 'Privacy Settings';
  const legalSectionTitle = 'Legal';
  const privacyPolicyText = 'Privacy Policy';
  const termsOfServiceText = 'Terms of Service';
  const accountManagementTitle = 'Account Management';
  const logoutText = 'Log Out';
  const deactivateAccountText = 'Deactivate Account';
  const loggingOutText = 'Logging out...';
  const deactivatingText = 'Deactivating...';
  const verificationModalTitle = 'Verify Account Deactivation';
  const verificationModalDescription = 'Enter the 6-digit verification code sent to your phone number.';
  const verificationCodePlaceholder = 'Enter 6-digit code';
  const verifyButtonText = 'Verify & Deactivate';
  const cancelButtonText = 'Cancel';
  const verifyingText = 'Verifying...';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* OAuth Status Section (Dev Mode Only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Authentication Status (Dev Only)</Text>
            {loadingOAuthStatus ? (
              <View style={styles.oauthStatusCard}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading authentication status...</Text>
              </View>
            ) : oauthStatus ? (
              <View style={styles.oauthStatusCard}>
                <Text style={styles.oauthCardTitle}>OAuth Providers</Text>
                
                {/* Google OAuth Status */}
                <View style={styles.oauthProviderCard}>
                  <View style={styles.oauthProviderHeader}>
                    <View style={styles.oauthProviderLeft}>
                      <IconSymbol
                        ios_icon_name="g.circle.fill"
                        android_material_icon_name="g-translate"
                        size={24}
                        color="#4285F4"
                      />
                      <Text style={styles.oauthProviderName}>Google Sign-In</Text>
                    </View>
                    <View style={[
                      styles.oauthStatusBadge,
                      { backgroundColor: oauthStatus.google?.enabled ? '#E8F5E9' : '#FFF3E0' }
                    ]}>
                      <IconSymbol
                        ios_icon_name={oauthStatus.google?.enabled ? "checkmark.circle.fill" : "exclamationmark.circle.fill"}
                        android_material_icon_name={oauthStatus.google?.enabled ? "check-circle" : "warning"}
                        size={14}
                        color={oauthStatus.google?.enabled ? "#4CAF50" : "#FF9800"}
                      />
                      <Text style={[
                        styles.oauthStatusText,
                        { color: oauthStatus.google?.enabled ? "#4CAF50" : "#FF9800" }
                      ]}>
                        {oauthStatus.google?.enabled ? "Active" : "Not Configured"}
                      </Text>
                    </View>
                  </View>
                  {!oauthStatus.google?.enabled && (
                    <View style={styles.oauthSetupInfo}>
                      <Text style={styles.oauthSetupText}>
                        Configure Google OAuth credentials to enable Google Sign-In
                      </Text>
                      <TouchableOpacity
                        style={styles.oauthSetupButton}
                        onPress={() => handleOpenSetupGuide("google")}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.oauthSetupButtonText}>Setup Guide</Text>
                        <IconSymbol
                          ios_icon_name="arrow.up.right"
                          android_material_icon_name="open-in-new"
                          size={14}
                          color="#007AFF"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Apple OAuth Status */}
                <View style={styles.oauthProviderCard}>
                  <View style={styles.oauthProviderHeader}>
                    <View style={styles.oauthProviderLeft}>
                      <IconSymbol
                        ios_icon_name="apple.logo"
                        android_material_icon_name="apple"
                        size={24}
                        color="#000"
                      />
                      <Text style={styles.oauthProviderName}>Apple Sign-In</Text>
                    </View>
                    <View style={[
                      styles.oauthStatusBadge,
                      { backgroundColor: oauthStatus.apple?.enabled ? '#E8F5E9' : '#FFF3E0' }
                    ]}>
                      <IconSymbol
                        ios_icon_name={oauthStatus.apple?.enabled ? "checkmark.circle.fill" : "exclamationmark.circle.fill"}
                        android_material_icon_name={oauthStatus.apple?.enabled ? "check-circle" : "warning"}
                        size={14}
                        color={oauthStatus.apple?.enabled ? "#4CAF50" : "#FF9800"}
                      />
                      <Text style={[
                        styles.oauthStatusText,
                        { color: oauthStatus.apple?.enabled ? "#4CAF50" : "#FF9800" }
                      ]}>
                        {oauthStatus.apple?.enabled ? "Active" : "Not Configured"}
                      </Text>
                    </View>
                  </View>
                  {!oauthStatus.apple?.enabled && (
                    <View style={styles.oauthSetupInfo}>
                      <Text style={styles.oauthSetupText}>
                        Configure Sign in with Apple to enable Apple Sign-In
                      </Text>
                      <TouchableOpacity
                        style={styles.oauthSetupButton}
                        onPress={() => handleOpenSetupGuide("apple")}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.oauthSetupButtonText}>Setup Guide</Text>
                        <IconSymbol
                          ios_icon_name="arrow.up.right"
                          android_material_icon_name="open-in-new"
                          size={14}
                          color="#007AFF"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadOAuthStatus}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="arrow.clockwise"
                    android_material_icon_name="refresh"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.refreshButtonText}>Refresh Status</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.oauthStatusCard}>
                <Text style={styles.errorText}>Failed to load authentication status</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadOAuthStatus}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="arrow.clockwise"
                    android_material_icon_name="refresh"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.refreshButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{accountSectionTitle}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleNotificationSettings}>
            <View style={styles.settingLeft}>
              <IconSymbol 
                ios_icon_name="bell.fill" 
                android_material_icon_name="notifications" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.settingText}>{notificationSettingsText}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePermissionsSettings}>
            <View style={styles.settingLeft}>
              <IconSymbol 
                ios_icon_name="checkmark.shield.fill" 
                android_material_icon_name="verified-user" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.settingText}>{permissionsSettingsText}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
            <View style={styles.settingLeft}>
              <IconSymbol 
                ios_icon_name="lock.fill" 
                android_material_icon_name="lock" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.settingText}>{privacySettingsText}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{legalSectionTitle}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <View style={styles.settingLeft}>
              <IconSymbol 
                ios_icon_name="doc.text.fill" 
                android_material_icon_name="description" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.settingText}>{privacyPolicyText}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
            <View style={styles.settingLeft}>
              <IconSymbol 
                ios_icon_name="doc.text.fill" 
                android_material_icon_name="description" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.settingText}>{termsOfServiceText}</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <IconSymbol 
              ios_icon_name="arrow.right.square.fill" 
              android_material_icon_name="logout" 
              size={24} 
              color={colors.background} 
            />
            <Text style={styles.logoutButtonText}>
              {isLoggingOut ? loggingOutText : logoutText}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.accountManagementTitle}>{accountManagementTitle}</Text>
          
          <TouchableOpacity 
            style={styles.deactivateButton} 
            onPress={handleDeactivateAccount}
            disabled={isDeactivating || isRequestingCode}
          >
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={24} 
              color={colors.background} 
            />
            <Text style={styles.deactivateButtonText}>
              {isRequestingCode ? 'Sending code...' : deactivateAccountText}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Verification Code Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowVerificationModal(false);
          setVerificationCode("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{verificationModalTitle}</Text>
            <Text style={styles.modalDescription}>{verificationModalDescription}</Text>
            
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder={verificationCodePlaceholder}
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowVerificationModal(false);
                  setVerificationCode("");
                }}
                disabled={isVerifyingCode}
              >
                <Text style={styles.modalCancelButtonText}>{cancelButtonText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalVerifyButton}
                onPress={handleVerifyAndDeactivate}
                disabled={isVerifyingCode || verificationCode.length !== 6}
              >
                <Text style={styles.modalVerifyButtonText}>
                  {isVerifyingCode ? verifyingText : verifyButtonText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  accountManagementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
  },
  deactivateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  bottomPadding: {
    height: 40,
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalVerifyButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalVerifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  oauthStatusCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  oauthCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  oauthProviderCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  oauthProviderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oauthProviderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oauthProviderName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  oauthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  oauthStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  oauthSetupInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundAlt,
  },
  oauthSetupText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  oauthSetupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  oauthSetupButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
