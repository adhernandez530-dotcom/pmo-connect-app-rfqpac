
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert, Image, ImageSourcePropType } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { Toast } from "@/components/Toast";
import Constants from "expo-constants";
import * as ImagePicker from 'expo-image-picker';
import { authenticatedGet, authenticatedPut, authenticatedPost, authenticatedDelete } from "@/utils/api";

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

interface Service {
  id: string;
  serviceName: string;
}

interface Knowledge {
  id: string;
  topic: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | undefined>(undefined);

  // Services and Knowledge
  const [services, setServices] = useState<Service[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [newService, setNewService] = useState('');
  const [newKnowledge, setNewKnowledge] = useState('');
  const [showServiceInput, setShowServiceInput] = useState(false);
  const [showKnowledgeInput, setShowKnowledgeInput] = useState(false);

  useEffect(() => {
    console.log('EditProfileScreen: Loading current profile data');
    loadProfile();
    loadServices();
    loadKnowledge();
  }, []);

  const loadProfile = async () => {
    console.log('EditProfileScreen: Fetching user profile');
    setLoading(true);
    try {
      const data = await authenticatedGet('/api/users/me');
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    console.log('EditProfileScreen: Loading services');
    try {
      const data = await authenticatedGet('/api/profile/services');
      console.log('EditProfileScreen: Services loaded', data);
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (error) {
      console.error('EditProfileScreen: Error loading services:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
    }
  };

  const loadKnowledge = async () => {
    console.log('EditProfileScreen: Loading knowledge topics');
    try {
      const data = await authenticatedGet('/api/profile/knowledge');
      console.log('EditProfileScreen: Knowledge loaded', data);
      if (Array.isArray(data)) {
        setKnowledge(data);
      }
    } catch (error) {
      console.error('EditProfileScreen: Error loading knowledge:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
    }
  };

  const handlePickImage = async () => {
    console.log('EditProfileScreen: User tapped change avatar');
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access photo library is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('EditProfileScreen: Image selected', result.assets[0].uri);
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const handleAddService = async () => {
    console.log('EditProfileScreen: User tapped Add Service button');
    console.log('EditProfileScreen: New service value:', newService);
    
    if (!newService.trim()) {
      console.log('EditProfileScreen: Service name is empty, showing alert');
      Alert.alert('Validation Error', 'Please enter a service name');
      return;
    }

    console.log('EditProfileScreen: Adding service:', newService.trim());
    try {
      const data = await authenticatedPost('/api/profile/services', {
        serviceName: newService.trim(),
      });
      console.log('EditProfileScreen: Service added successfully', data);
      setServices([...services, data]);
      setNewService('');
      setShowServiceInput(false);
      
      setToastMessage('Service added successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('EditProfileScreen: Error adding service:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
      Alert.alert('Error', `Failed to add service: ${errorMessage}`);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    console.log('EditProfileScreen: Removing service:', serviceId);
    try {
      await authenticatedDelete(`/api/profile/services/${serviceId}`);
      console.log('EditProfileScreen: Service removed');
      setServices(services.filter(s => s.id !== serviceId));
      
      setToastMessage('Service removed');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('EditProfileScreen: Error removing service:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
      Alert.alert('Error', `Failed to remove service: ${errorMessage}`);
    }
  };

  const handleAddKnowledge = async () => {
    console.log('EditProfileScreen: User tapped Add Knowledge button');
    console.log('EditProfileScreen: New knowledge value:', newKnowledge);
    
    if (!newKnowledge.trim()) {
      console.log('EditProfileScreen: Knowledge topic is empty, showing alert');
      Alert.alert('Validation Error', 'Please enter a knowledge topic');
      return;
    }

    console.log('EditProfileScreen: Adding knowledge topic:', newKnowledge.trim());
    try {
      const data = await authenticatedPost('/api/profile/knowledge', {
        topic: newKnowledge.trim(),
      });
      console.log('EditProfileScreen: Knowledge topic added successfully', data);
      setKnowledge([...knowledge, data]);
      setNewKnowledge('');
      setShowKnowledgeInput(false);
      
      setToastMessage('Knowledge topic added successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('EditProfileScreen: Error adding knowledge topic:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
      Alert.alert('Error', `Failed to add knowledge topic: ${errorMessage}`);
    }
  };

  const handleRemoveKnowledge = async (knowledgeId: string) => {
    console.log('EditProfileScreen: Removing knowledge topic:', knowledgeId);
    try {
      await authenticatedDelete(`/api/profile/knowledge/${knowledgeId}`);
      console.log('EditProfileScreen: Knowledge topic removed');
      setKnowledge(knowledge.filter(k => k.id !== knowledgeId));
      
      setToastMessage('Knowledge topic removed');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('EditProfileScreen: Error removing knowledge topic:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
      Alert.alert('Error', `Failed to remove knowledge topic: ${errorMessage}`);
    }
  };

  const handleSave = async () => {
    console.log('EditProfileScreen: User tapped Save Changes button');
    console.log('EditProfileScreen: Current form values:', {
      username,
      fullName,
      location,
      bio,
      avatarUrl: localAvatarUri || avatarUrl,
    });
    
    if (!fullName.trim()) {
      console.log('EditProfileScreen: Full name is empty, showing validation error');
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    setSaving(true);
    console.log('EditProfileScreen: Saving profile changes...');
    try {
      const updateData = {
        username: username.trim(),
        fullName: fullName.trim(),
        location: location.trim(),
        bio: bio.trim(),
        avatarUrl: localAvatarUri || avatarUrl || '',
      };
      console.log('EditProfileScreen: Sending update data:', updateData);
      
      const data = await authenticatedPut('/api/users/me', updateData);
      console.log('EditProfileScreen: Profile updated successfully', data);
      
      setToastMessage('Profile updated successfully!');
      setShowToast(true);
      
      setTimeout(() => {
        console.log('EditProfileScreen: Navigating back after successful save');
        setShowToast(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('EditProfileScreen: Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EditProfileScreen: Error details:', errorMessage);
      Alert.alert('Error', `Failed to update profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('EditProfileScreen: User tapped Cancel button - navigating to home');
    router.push('/(tabs)/(home)');
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
  const servicesLabel = 'Services';
  const servicesPlaceholder = 'Add a service you provide';
  const knowledgeLabel = 'Knowledge Topics';
  const knowledgePlaceholder = 'Add a topic you know about';
  const addButtonText = 'Add';

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
      
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
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

          {/* Services Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{servicesLabel}</Text>
              <TouchableOpacity 
                style={styles.addIconButton}
                onPress={() => {
                  console.log('EditProfileScreen: Toggling service input visibility');
                  setShowServiceInput(!showServiceInput);
                }}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
            
            {showServiceInput && (
              <View style={styles.addInputContainer}>
                <TextInput
                  style={styles.addInput}
                  value={newService}
                  onChangeText={(text) => {
                    console.log('EditProfileScreen: Service input changed:', text);
                    setNewService(text);
                  }}
                  placeholder={servicesPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleAddService}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddService}
                >
                  <Text style={styles.addButtonText}>{addButtonText}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.tagsContainer}>
              {services.map((service, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{service.serviceName}</Text>
                  <TouchableOpacity 
                    onPress={() => handleRemoveService(service.id)}
                    style={styles.tagRemove}
                  >
                    <IconSymbol 
                      ios_icon_name="xmark.circle.fill" 
                      android_material_icon_name="cancel" 
                      size={18} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Knowledge Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{knowledgeLabel}</Text>
              <TouchableOpacity 
                style={styles.addIconButton}
                onPress={() => {
                  console.log('EditProfileScreen: Toggling knowledge input visibility');
                  setShowKnowledgeInput(!showKnowledgeInput);
                }}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
            
            {showKnowledgeInput && (
              <View style={styles.addInputContainer}>
                <TextInput
                  style={styles.addInput}
                  value={newKnowledge}
                  onChangeText={(text) => {
                    console.log('EditProfileScreen: Knowledge input changed:', text);
                    setNewKnowledge(text);
                  }}
                  placeholder={knowledgePlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleAddKnowledge}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddKnowledge}
                >
                  <Text style={styles.addButtonText}>{addButtonText}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.tagsContainer}>
              {knowledge.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item.topic}</Text>
                  <TouchableOpacity 
                    onPress={() => handleRemoveKnowledge(item.id)}
                    style={styles.tagRemove}
                  >
                    <IconSymbol 
                      ios_icon_name="xmark.circle.fill" 
                      android_material_icon_name="cancel" 
                      size={18} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              ))}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addIconButton: {
    padding: 4,
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
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 20,
    gap: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.text,
  },
  tagRemove: {
    padding: 2,
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
