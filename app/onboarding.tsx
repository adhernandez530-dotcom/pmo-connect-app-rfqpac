
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
import { authenticatedPost, authenticatedGet } from "@/utils/api";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "http://localhost:3000";

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
      const response = await authenticatedGet(
        `${BACKEND_URL}/api/onboarding/check-username/${usernameToCheck}`
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
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!username || !fullName) {
      Alert.alert("Error", "Username and full name are required");
      return;
    }

    setLoading(true);
    console.log("Completing onboarding with data:", {
      username,
      fullName,
      location,
      bio,
      phoneNumber,
      allowContacts,
    });

    try {
      const response = await authenticatedPost(`${BACKEND_URL}/api/onboarding/complete`, {
        username,
        fullName,
        location: location || undefined,
        bio: bio || undefined,
        phoneNumber: phoneNumber || undefined,
        allowContacts,
      });

      console.log("Onboarding completed successfully:", response);
      Alert.alert("Welcome!", "Your profile has been set up successfully", [
        {
          text: "Get Started",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to complete onboarding. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
            {bio.length}/500
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
        </View>
      </View>
    );
  };

  const progressPercentage = (step / 3) * 100;

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
              Step {step} of 3
            </Text>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
