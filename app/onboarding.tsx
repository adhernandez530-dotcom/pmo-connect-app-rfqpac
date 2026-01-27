
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedPost, apiGet } from "@/utils/api";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Contacts from "expo-contacts";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  photoLibrary: PermissionStatus;
  contacts: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form fields
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [allowContacts, setAllowContacts] = useState(false);

  // Step 4: Services & Knowledge
  const [services, setServices] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [knowledgeInput, setKnowledgeInput] = useState("");

  // Step 5: Permissions
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'undetermined',
    microphone: 'undetermined',
    photoLibrary: 'undetermined',
    contacts: 'undetermined',
    location: 'undetermined',
    notifications: 'undetermined',
  });

  // Validation
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");

  const showError = (message: string) => {
    console.log("Showing error modal:", message);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }

    setCheckingUsername(true);
    setUsernameError("");

    try {
      const response = await apiGet(
        `/api/onboarding/check-username/${usernameToCheck}`
      );

      if (response.available) {
        setUsernameAvailable(true);
        setUsernameError("");
      } else {
        setUsernameAvailable(false);
        setUsernameError("Username is already taken");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Could not check username availability");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    const cleanedUsername = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleanedUsername);
    setUsernameAvailable(null);
    setUsernameError("");
  };

  const handleUsernameBlur = () => {
    if (username.length >= 3) {
      checkUsernameAvailability(username);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!username || username.length < 3) {
        showError("Username must be at least 3 characters");
        return;
      }
      if (!fullName) {
        showError("Please enter your full name");
        return;
      }
      if (usernameAvailable === false) {
        showError("Please choose a different username");
        return;
      }
      console.log("User completed Step 1 - moving to Step 2");
      setStep(2);
    } else if (step === 2) {
      console.log("User completed Step 2 - moving to Step 3");
      setStep(3);
    } else if (step === 3) {
      console.log("User completed Step 3 - moving to Step 4");
      setStep(4);
    } else if (step === 4) {
      console.log("User completed Step 4 - moving to Step 5 (Permissions)");
      setStep(5);
      checkAllPermissions();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      console.log(`User going back from Step ${step} to Step ${step - 1}`);
      setStep(step - 1);
    }
  };

  const handleAddService = () => {
    const trimmedService = serviceInput.trim();
    if (!trimmedService) {
      showError("Please enter a service name");
      return;
    }
    if (services.length >= 10) {
      showError("You can add up to 10 services");
      return;
    }
    if (services.includes(trimmedService)) {
      showError("This service is already added");
      return;
    }
    console.log("Adding service:", trimmedService);
    setServices([...services, trimmedService]);
    setServiceInput("");
  };

  const handleRemoveService = (index: number) => {
    console.log("Removing service at index:", index);
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
  };

  const handleAddKnowledge = () => {
    const trimmedKnowledge = knowledgeInput.trim();
    if (!trimmedKnowledge) {
      showError("Please enter a knowledge topic");
      return;
    }
    if (knowledge.length >= 10) {
      showError("You can add up to 10 knowledge topics");
      return;
    }
    if (knowledge.includes(trimmedKnowledge)) {
      showError("This topic is already added");
      return;
    }
    console.log("Adding knowledge topic:", trimmedKnowledge);
    setKnowledge([...knowledge, trimmedKnowledge]);
    setKnowledgeInput("");
  };

  const handleRemoveKnowledge = (index: number) => {
    console.log("Removing knowledge topic at index:", index);
    const updatedKnowledge = knowledge.filter((_, i) => i !== index);
    setKnowledge(updatedKnowledge);
  };

  const checkAllPermissions = async () => {
    console.log('Onboarding: Checking all permissions');
    try {
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      const microphoneStatus = await Camera.getMicrophonePermissionsAsync();
      const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();
      const contactsStatus = await Contacts.getPermissionsAsync();
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const notificationsStatus = await Notifications.getPermissionsAsync();

      setPermissions({
        camera: cameraStatus.status,
        microphone: microphoneStatus.status,
        photoLibrary: mediaLibraryStatus.status,
        contacts: contactsStatus.status,
        location: locationStatus.status,
        notifications: notificationsStatus.status,
      });

      console.log('Onboarding: Current permissions:', {
        camera: cameraStatus.status,
        microphone: microphoneStatus.status,
        photoLibrary: mediaLibraryStatus.status,
        contacts: contactsStatus.status,
        location: locationStatus.status,
        notifications: notificationsStatus.status,
      });
    } catch (error) {
      console.error('Onboarding: Error checking permissions:', error);
    }
  };

  const requestCameraPermission = async () => {
    console.log('Onboarding: User tapped Camera permission');
    try {
      const result = await Camera.requestCameraPermissionsAsync();
      console.log('Onboarding: Camera permission result:', result.status);
      setPermissions(prev => ({ ...prev, camera: result.status }));
    } catch (error) {
      console.error('Onboarding: Error requesting camera permission:', error);
    }
  };

  const requestMicrophonePermission = async () => {
    console.log('Onboarding: User tapped Microphone permission');
    try {
      const result = await Camera.requestMicrophonePermissionsAsync();
      console.log('Onboarding: Microphone permission result:', result.status);
      setPermissions(prev => ({ ...prev, microphone: result.status }));
    } catch (error) {
      console.error('Onboarding: Error requesting microphone permission:', error);
    }
  };

  const requestPhotoLibraryPermission = async () => {
    console.log('Onboarding: User tapped Photo Library permission');
    try {
      const result = await MediaLibrary.requestPermissionsAsync();
      console.log('Onboarding: Photo Library permission result:', result.status);
      setPermissions(prev => ({ ...prev, photoLibrary: result.status }));
    } catch (error) {
      console.error('Onboarding: Error requesting photo library permission:', error);
    }
  };

  const requestContactsPermission = async () => {
    console.log('Onboarding: User tapped Contacts permission');
    try {
      const result = await Contacts.requestPermissionsAsync();
      console.log('Onboarding: Contacts permission result:', result.status);
      setPermissions(prev => ({ ...prev, contacts: result.status }));
    } catch (error) {
      console.error('Onboarding: Error requesting contacts permission:', error);
    }
  };

  const requestLocationPermission = async () => {
    console.log('Onboarding: User tapped Location permission');
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      console.log('Onboarding: Location permission result:', result.status);
      setPermissions(prev => ({ ...prev, location: result.status }));
    } catch (error) {
      console.error('Onboarding: Error requesting location permission:', error);
    }
  };

  const requestNotificationsPermission = async () => {
    console.log('Onboarding: User tapped Notifications permission');
    try {
      const result = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      console.log('Onboarding: Notifications permission result:', result.status);
      setPermissions(prev => ({ ...prev, notifications: result.status }));
    } catch (error) {
      console.error('Onboarding: Error requesting notifications permission:', error);
    }
  };

  const requestAllPermissions = async () => {
    console.log('Onboarding: User tapped Request All Permissions');
    await requestCameraPermission();
    await requestMicrophonePermission();
    await requestPhotoLibraryPermission();
    await requestContactsPermission();
    await requestLocationPermission();
    await requestNotificationsPermission();
  };

  const getStatusColor = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return colors.primary;
      case 'denied':
        return '#FF3B30';
      case 'undetermined':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return 'check-circle';
      case 'denied':
        return 'cancel';
      case 'undetermined':
        return 'help';
      default:
        return 'help';
    }
  };

  const handleComplete = async () => {
    if (!username || !fullName) {
      showError("Username and full name are required");
      return;
    }

    setLoading(true);
    
    const onboardingData = {
      username,
      fullName,
      location: location || undefined,
      bio: bio || undefined,
      phoneNumber: phoneNumber || undefined,
      allowContacts,
      services: services.length > 0 ? services : undefined,
      knowledge: knowledge.length > 0 ? knowledge : undefined,
    };
    
    console.log("Completing onboarding with data:", onboardingData);

    try {
      const response = await authenticatedPost(`/api/onboarding/complete`, onboardingData);

      console.log("Onboarding completed successfully:", response);
      
      // Use custom modal instead of Alert for cross-platform compatibility
      setErrorMessage("Your profile has been set up successfully! Welcome to the community.");
      setErrorModalVisible(true);
      
      // Navigate after a short delay
      setTimeout(() => {
        console.log("Navigating to home after successful onboarding");
        router.replace("/(tabs)");
      }, 1500);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      let userFriendlyMessage = "Failed to complete setup. Please try again.";
      
      if (error?.message?.includes("401")) {
        userFriendlyMessage = "Authentication error. Please sign out and sign in again.";
      } else if (error?.message?.includes("500")) {
        userFriendlyMessage = "Server error. Our team has been notified. Please try again in a moment.";
      } else if (error?.message?.includes("username")) {
        userFriendlyMessage = "This username is already taken. Please choose a different one.";
      } else if (error?.message) {
        userFriendlyMessage = error.message;
      }
      
      showError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStep4 = async () => {
    console.log("User skipped Step 4 (Services & Knowledge) - moving to Step 5 (Permissions)");
    setStep(5);
    checkAllPermissions();
  };

  const renderStep1 = () => {
    const usernameHint = `Username must be 3+ characters (letters, numbers, underscore)`;
    const usernameStatusColor = usernameAvailable === true
      ? "#34C759"
      : usernameAvailable === false
      ? "#FF3B30"
      : colors.textSecondary;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Create Your Profile</Text>
        <Text style={styles.stepDescription}>
          Let&apos;s start with the basics
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username *</Text>
          <View style={styles.usernameInputWrapper}>
            <TextInput
              style={[
                styles.input,
                usernameError ? styles.inputError : null,
                usernameAvailable === true ? styles.inputSuccess : null,
              ]}
              placeholder="johndoe"
              value={username}
              onChangeText={handleUsernameChange}
              onBlur={handleUsernameBlur}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            {checkingUsername && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.usernameIndicator}
              />
            )}
            {!checkingUsername && usernameAvailable !== null && (
              <IconSymbol
                ios_icon_name={usernameAvailable ? "checkmark.circle.fill" : "xmark.circle.fill"}
                android_material_icon_name={usernameAvailable ? "check-circle" : "cancel"}
                size={20}
                color={usernameStatusColor}
                style={styles.usernameIndicator}
              />
            )}
          </View>
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : (
            <Text style={styles.hintText}>{usernameHint}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            maxLength={100}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!username || !fullName || usernameAvailable === false) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!username || !fullName || usernameAvailable === false}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep2 = () => {
    const characterCountText = `${bio.length}/500`;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Tell Us More</Text>
        <Text style={styles.stepDescription}>
          Help others find and connect with you
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="New York, NY"
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
            maxLength={100}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself, your skills, and what you're looking for..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {characterCountText}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep3 = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Contact Preferences</Text>
        <Text style={styles.stepDescription}>
          Optional: Add your phone number for easier connections
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAllowContacts(!allowContacts)}
        >
          <View style={[styles.checkbox, allowContacts && styles.checkboxChecked]}>
            {allowContacts && (
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color="#fff"
              />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            Allow friends to find me by phone number
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep4 = () => {
    const servicesCountText = `${services.length}/10`;
    const knowledgeCountText = `${knowledge.length}/10`;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Services & Knowledge</Text>
        <Text style={styles.stepDescription}>
          Share what you offer and what you know (Optional)
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Services You Provide</Text>
            <Text style={styles.countText}>{servicesCountText}</Text>
          </View>
          <View style={styles.addInputRow}>
            <TextInput
              style={[styles.input, styles.addInput]}
              placeholder="e.g., Web Design, Photography"
              value={serviceInput}
              onChangeText={setServiceInput}
              autoCapitalize="words"
              maxLength={50}
              onSubmitEditing={handleAddService}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, services.length >= 10 && styles.buttonDisabled]}
              onPress={handleAddService}
              disabled={services.length >= 10}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
          {services.length > 0 && (
            <View style={styles.tagContainer}>
              {services.map((service, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{service}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveService(index)}
                    style={styles.tagRemove}
                  >
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={14}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Knowledge Topics</Text>
            <Text style={styles.countText}>{knowledgeCountText}</Text>
          </View>
          <View style={styles.addInputRow}>
            <TextInput
              style={[styles.input, styles.addInput]}
              placeholder="e.g., React Native, Marketing"
              value={knowledgeInput}
              onChangeText={setKnowledgeInput}
              autoCapitalize="words"
              maxLength={50}
              onSubmitEditing={handleAddKnowledge}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, knowledge.length >= 10 && styles.buttonDisabled]}
              onPress={handleAddKnowledge}
              disabled={knowledge.length >= 10}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
          {knowledge.length > 0 && (
            <View style={styles.tagContainer}>
              {knowledge.map((topic, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{topic}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveKnowledge(index)}
                    style={styles.tagRemove}
                  >
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={14}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.buttonColumn}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipStep4}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.backButtonFullWidth]}
            onPress={handleBack}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep5 = () => {
    const cameraLabel = 'Camera';
    const cameraDesc = 'Take photos and videos';
    const microphoneLabel = 'Microphone';
    const microphoneDesc = 'Record audio and voice messages';
    const photoLibraryLabel = 'Photo Library';
    const photoLibraryDesc = 'Access and upload photos';
    const contactsLabel = 'Contacts';
    const contactsDesc = 'Find friends from your contacts';
    const locationLabel = 'Location';
    const locationDesc = 'Share your location with friends';
    const notificationsLabel = 'Notifications';
    const notificationsDesc = 'Receive push notifications';

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>App Permissions</Text>
        <Text style={styles.stepDescription}>
          Grant permissions to unlock all features
        </Text>

        <ScrollView style={styles.permissionsScroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.permissionItem} onPress={requestCameraPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="camera.fill" 
                android_material_icon_name="camera" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{cameraLabel}</Text>
                <Text style={styles.permissionDescription}>{cameraDesc}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name={getStatusIcon(permissions.camera)} 
              size={20} 
              color={getStatusColor(permissions.camera)} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestMicrophonePermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="mic.fill" 
                android_material_icon_name="mic" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{microphoneLabel}</Text>
                <Text style={styles.permissionDescription}>{microphoneDesc}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name={getStatusIcon(permissions.microphone)} 
              size={20} 
              color={getStatusColor(permissions.microphone)} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestPhotoLibraryPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="photo" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{photoLibraryLabel}</Text>
                <Text style={styles.permissionDescription}>{photoLibraryDesc}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name={getStatusIcon(permissions.photoLibrary)} 
              size={20} 
              color={getStatusColor(permissions.photoLibrary)} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestContactsPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="person.2.fill" 
                android_material_icon_name="contacts" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{contactsLabel}</Text>
                <Text style={styles.permissionDescription}>{contactsDesc}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name={getStatusIcon(permissions.contacts)} 
              size={20} 
              color={getStatusColor(permissions.contacts)} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestLocationPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{locationLabel}</Text>
                <Text style={styles.permissionDescription}>{locationDesc}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name={getStatusIcon(permissions.location)} 
              size={20} 
              color={getStatusColor(permissions.location)} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestNotificationsPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="bell.fill" 
                android_material_icon_name="notifications" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{notificationsLabel}</Text>
                <Text style={styles.permissionDescription}>{notificationsDesc}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name={getStatusIcon(permissions.notifications)} 
              size={20} 
              color={getStatusColor(permissions.notifications)} 
            />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.buttonColumn}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestAllPermissions}
          >
            <Text style={styles.primaryButtonText}>Grant All Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.completeButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.backButtonFullWidth]}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const progressPercentage = (step / 5) * 100;
  const stepText = `Step ${step} of 5`;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Welcome",
          headerBackVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stepText}
            </Text>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {errorMessage.includes("successfully") ? "Success!" : "Notice"}
            </Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.backgroundAlt,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  inputSuccess: {
    borderColor: "#34C759",
  },
  usernameInputWrapper: {
    position: "relative",
  },
  usernameIndicator: {
    position: "absolute",
    right: 16,
    top: 15,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  hintText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#FF3B30",
  },
  characterCount: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  addInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  tagRemove: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionsScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  permissionContent: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  primaryButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  buttonColumn: {
    marginTop: 16,
  },
  skipButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonFullWidth: {
    marginRight: 0,
    marginTop: 12,
  },
  completeButton: {
    marginTop: 12,
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
