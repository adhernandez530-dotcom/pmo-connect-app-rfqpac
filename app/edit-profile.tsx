
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert, Image, ImageSourcePropType } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import Constants from "expo-constants";
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface UserProfile {
  username: string;
  fullName: string;
  location: string;
  bio: string;
  avatarUrl?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log('EditProfileScreen: Loading current profile data');
    loadProfile();
  }, []);

  const loadProfile = async () => {
    console.log('EditProfileScreen: Fetching user profile');
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/me`);
      const data = await response.json();
      console.log('EditProfileScreen: Profile loaded successfully', data);
      
      if (data && !data.error) {
        setUsername(data.username || '');
        setFullName(data.fullName || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatarUrl);
      } else {
        console.log('EditProfileScreen: Profile API returned error or invalid data:', data);
      }
    } catch (error) {
      console.error('EditProfileScreen: Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    console.log('EditProfileScreen: User tapped change avatar');
    
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access photo library is required');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('EditProfileScreen: Image selected', result.assets[0].uri);
      setLocalAvatarUri(result.assets[0].uri);
      // TODO: Backend Integration - POST /api/upload/avatar with multipart form data → { url: string }
      // For now, just store the local URI
    }
  };

  const handleSave = async () => {
    console.log('EditProfileScreen: User tapped Save button');
    
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    setSaving(true);
    try {
      // TODO: Backend Integration - PUT /api/users/me with { username, fullName, location, bio, avatarUrl }
      const response = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          fullName,
          location,
          bio,
          avatarUrl: localAvatarUri || avatarUrl,
        }),
      });

      const data = await response.json();
      console.log('EditProfileScreen: Profile update response', data);

      if (response.ok) {
        console.log('EditProfileScreen: Profile updated successfully');
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        console.error('EditProfileScreen: Profile update failed', data);
        Alert.alert('Error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('EditProfileScreen: Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('EditProfileScreen: User tapped Cancel button');
    router.back();
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const displayAvatarUri = localAvatarUri || avatarUrl;
  const initials = getInitials(fullName);
  const saveButtonText = saving ? 'Saving...' : 'Save Changes';
  const cancelButtonText = 'Cancel';
  const editProfileTitle = 'Edit Profile';
  const avatarLabel = 'Profile Photo';
  const changePhotoText = 'Change Photo';
  const usernameLabel = 'Display Name';
  const usernamePlaceholder = '@username';
  const fullNameLabel = 'Full Name';
  const fullNamePlaceholder = 'Enter your full name';
  const bioLabel = 'Bio';
  const bioPlaceholder = 'Tell others about yourself...';
  const locationLabel = 'Location';
  const locationPlaceholder = 'City, Country';

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: editProfileTitle,
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: editProfileTitle,
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{avatarLabel}</Text>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {displayAvatarUri ? (
                  <Image 
                    source={resolveImageSource(displayAvatarUri)} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
                <IconSymbol 
                  ios_icon_name="camera.fill" 
                  android_material_icon_name="camera" 
                  size={18} 
                  color={colors.primary} 
                />
                <Text style={styles.changePhotoText}>{changePhotoText}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Display Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{usernameLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={usernamePlaceholder}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{fullNameLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={fullNamePlaceholder}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{bioLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder={bioPlaceholder}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{locationLabel}</Text>
            <View style={styles.inputContainer}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on" 
                size={20} 
                color={colors.textSecondary} 
              />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={location}
                onChangeText={setLocation}
                placeholder={locationPlaceholder}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saveButtonText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
