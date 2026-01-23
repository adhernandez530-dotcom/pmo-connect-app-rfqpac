
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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { apiPost, apiGet } from "@/utils/api";

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

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

  // Validation
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");

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
        Alert.alert("Error", "Username must be at least 3 characters");
        return;
      }
      if (!fullName) {
        Alert.alert("Error", "Please enter your full name");
        return;
      }
      if (usernameAvailable === false) {
        Alert.alert("Error", "Please choose a different username");
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
      Alert.alert("Error", "Please enter a service name");
      return;
    }
    if (services.length >= 10) {
      Alert.alert("Limit Reached", "You can add up to 10 services");
      return;
    }
    if (services.includes(trimmedService)) {
      Alert.alert("Duplicate", "This service is already added");
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
      Alert.alert("Error", "Please enter a knowledge topic");
      return;
    }
    if (knowledge.length >= 10) {
      Alert.alert("Limit Reached", "You can add up to 10 knowledge topics");
      return;
    }
    if (knowledge.includes(trimmedKnowledge)) {
      Alert.alert("Duplicate", "This topic is already added");
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

  const handleComplete = async () => {
    if (!username || !fullName) {
      Alert.alert("Error", "Username and full name are required");
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
      const response = await apiPost(`/api/onboarding/complete`, onboardingData);

      console.log("Onboarding completed successfully:", response);
      Alert.alert("Welcome!", "Your profile has been set up successfully", [
        {
          text: "Get Started",
          onPress: () => {
            console.log("User tapped Get Started - navigating to home");
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      const errorMessage = error?.message || "Failed to complete onboarding. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStep4 = async () => {
    console.log("User skipped Step 4 (Services & Knowledge)");
    await handleComplete();
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
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Complete</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.skipButton, loading && styles.buttonDisabled]}
            onPress={handleSkipStep4}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
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

  const progressPercentage = (step / 4) * 100;
  const stepText = `Step ${step} of 4`;

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
        </ScrollView>
      </KeyboardAvoidingView>
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
