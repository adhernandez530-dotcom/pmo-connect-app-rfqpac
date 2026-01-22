
import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { apiCall } from "@/utils/api";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

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
              const data = await apiCall<{ success: boolean; message: string }>('/api/account/logout', {
                method: 'POST',
                body: JSON.stringify({}),
              });
              
              console.log('SettingsScreen: Logout response:', data);
              
              // Sign out from auth context (clears local session)
              await signOut();
              
              Alert.alert('Success', 'You have been logged out successfully');
              // Navigate to auth screen
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

  const handleDeactivateAccount = () => {
    console.log('SettingsScreen: User tapped Deactivate Account button');
    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to deactivate your account? This action will hide your profile and you can reactivate it later by logging in again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('SettingsScreen: Account deactivation cancelled'),
        },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will deactivate your account. Are you absolutely sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Yes, Deactivate',
                  style: 'destructive',
                  onPress: async () => {
                    console.log('SettingsScreen: Deactivating account');
                    setIsDeactivating(true);
                    try {
                      // Call backend deactivate endpoint
                      const data = await apiCall<{ success: boolean; message: string }>('/api/account/deactivate', {
                        method: 'DELETE',
                        body: JSON.stringify({}),
                      });
                      
                      console.log('SettingsScreen: Deactivate response:', data);
                      
                      // Sign out from auth context (clears local session)
                      await signOut();
                      
                      Alert.alert('Account Deactivated', 'Your account has been deactivated successfully');
                      // Navigate to auth screen
                      router.replace('/auth');
                    } catch (error) {
                      console.error('SettingsScreen: Error deactivating account:', error);
                      Alert.alert('Error', 'Failed to deactivate account. Please try again.');
                    } finally {
                      setIsDeactivating(false);
                    }
                  },
                },
              ]
            );
          },
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

  const handleAccountSettings = () => {
    console.log('SettingsScreen: User tapped Account Settings');
    Alert.alert('Coming Soon', 'Account settings will be available soon');
  };

  const handlePrivacySettings = () => {
    console.log('SettingsScreen: User tapped Privacy Settings');
    router.push('/privacy-settings');
  };

  const settingsTitle = 'Settings';
  const accountSectionTitle = 'Account';
  const notificationSettingsText = 'Notification Settings';
  const accountSettingsText = 'Account Settings';
  const privacySettingsText = 'Privacy Settings';
  const legalSectionTitle = 'Legal';
  const privacyPolicyText = 'Privacy Policy';
  const termsOfServiceText = 'Terms of Service';
  const dangerZoneTitle = 'Danger Zone';
  const logoutText = 'Log Out';
  const deactivateAccountText = 'Deactivate Account';
  const loggingOutText = 'Logging out...';
  const deactivatingText = 'Deactivating...';

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

          <TouchableOpacity style={styles.settingItem} onPress={handleAccountSettings}>
            <View style={styles.settingLeft}>
              <IconSymbol 
                ios_icon_name="person.fill" 
                android_material_icon_name="person" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.settingText}>{accountSettingsText}</Text>
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
          <Text style={styles.dangerSectionTitle}>{dangerZoneTitle}</Text>
          
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

          <TouchableOpacity 
            style={styles.deactivateButton} 
            onPress={handleDeactivateAccount}
            disabled={isDeactivating}
          >
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={24} 
              color={colors.background} 
            />
            <Text style={styles.deactivateButtonText}>
              {isDeactivating ? deactivatingText : deactivateAccountText}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  dangerSectionTitle: {
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
});
