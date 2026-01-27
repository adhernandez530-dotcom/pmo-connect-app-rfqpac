
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Linking,
  Modal,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup" | "forgot-password";

export default function AuthScreen() {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    signInWithApple, 
    forgotPassword,
    loading: authLoading 
  } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  
  // Validation states
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Show loading screen while checking auth state
  if (authLoading) {
    const loadingText = "Loading...";
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  const showError = (message: string) => {
    console.log("Showing error to user:", message);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (pwd: string, confirmPwd: string): boolean => {
    if (confirmPwd && pwd !== confirmPwd) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (mode === "signup") {
      validatePassword(text);
      if (confirmPassword) {
        validateConfirmPassword(text, confirmPassword);
      }
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    validateConfirmPassword(password, text);
  };

  const handleEmailAuth = async () => {
    console.log("User tapped email auth button - mode:", mode);
    
    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      return;
    }

    // Validate confirm password in signup mode
    if (mode === "signup") {
      if (!confirmPassword) {
        showError("Please confirm your password");
        return;
      }
      if (!validateConfirmPassword(password, confirmPassword)) {
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        console.log("User signing in with email:", email);
        await signInWithEmail(email, password);
        console.log("Sign in successful - root layout will handle navigation");
      } else {
        console.log("User signing up with email:", email, "name:", name || "(none)");
        await signUpWithEmail(email, password, name || undefined);
        console.log("Sign up successful - root layout will redirect to email verification");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      const errorMsg = error.message || error.toString() || "Authentication failed";
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    console.log("User tapped forgot password");
    
    if (!email) {
      showError("Please enter your email address to reset your password.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      showError("If an account exists for this email, we've sent a reset link. Please check your inbox.");
      setMode("signin");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      showError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple") => {
    console.log("User tapped social auth button - provider:", provider);
    setOauthLoading(true);
    
    // Set a timeout to prevent getting stuck on loading screen
    const timeoutId = setTimeout(() => {
      console.log("OAuth timeout - resetting loading state");
      setOauthLoading(false);
      showError("The authentication process is taking longer than expected. Please try again or use email sign in.");
    }, 30000); // 30 second timeout
    
    try {
      console.log("Starting", provider, "sign in flow");
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "apple") {
        await signInWithApple();
      }
      console.log("Social auth initiated");
      clearTimeout(timeoutId);
    } catch (error: any) {
      console.error("Social auth error:", error);
      clearTimeout(timeoutId);
      setOauthLoading(false);
      const errorMsg = error.message || error.toString() || "Authentication failed";
      
      // Only show error if there's an actual error (not user cancellation)
      if (!errorMsg.includes("cancelled") && !errorMsg.includes("canceled")) {
        showError(errorMsg);
      }
    }
  };

  const handleSwitchMode = () => {
    console.log("User tapped switch mode button - current mode:", mode);
    const newMode = mode === "signin" ? "signup" : "signin";
    setMode(newMode);
    setPasswordError("");
    setConfirmPasswordError("");
    console.log("Switched to mode:", newMode);
  };

  const handleOpenTerms = () => {
    console.log("User tapped Terms of Service link");
    Linking.openURL("https://putmeon.app/terms");
  };

  const handleOpenPrivacy = () => {
    console.log("User tapped Privacy Policy link");
    Linking.openURL("https://putmeon.app/privacy");
  };

  const titleText = mode === "signin" 
    ? "Welcome Back" 
    : mode === "signup" 
    ? "Create Account" 
    : "Reset Password";
  
  const subtitleText = mode === "signin" 
    ? "Sign in to continue" 
    : mode === "signup"
    ? "Sign up to get started"
    : "Enter your email to receive a reset link";
  
  const primaryButtonText = mode === "signin" 
    ? "Sign In" 
    : mode === "signup"
    ? "Sign Up"
    : "Send Reset Link";
  
  const switchModeText = mode === "signin"
    ? "Don't have an account? Sign Up"
    : "Already have an account? Sign In";
  
  const dividerText = "or continue with";
  const googleButtonText = "Continue with Google";
  const appleButtonText = "Continue with Apple";
  const forgotPasswordText = "Forgot password?";
  const termsText = "By continuing, you agree to our ";
  const termsLinkText = "Terms of Service";
  const andText = " and ";
  const privacyLinkText = "Privacy Policy";
  const oauthLoadingText = "Redirecting to sign in...";
  const cancelButtonText = "Cancel";
  
  // Check if form is valid for signup
  const isSignupValid = mode === "signup" && 
    email && 
    password && 
    confirmPassword && 
    password.length >= 6 && 
    password === confirmPassword &&
    !passwordError &&
    !confirmPasswordError;

  const isFormValid = mode === "signup" ? isSignupValid : (email && password);
  
  console.log("AuthScreen: Rendering auth screen - mode:", mode, "loading:", loading, "oauthLoading:", oauthLoading);

  // Show OAuth loading state with cancel button
  if (oauthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{oauthLoadingText}</Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            console.log("User cancelled OAuth loading");
            setOauthLoading(false);
          }}
        >
          <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Forgot password mode
  if (mode === "forgot-password") {
    const backToSignInText = "Back to Sign In";
    
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setMode("signin")}
              disabled={loading}
            >
              <Text style={styles.switchModeText}>{backToSignInText}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Error Modal */}
        <Modal
          visible={errorModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Notice</Text>
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
      </KeyboardAvoidingView>
    );
  }

  // Main auth screen (sign in / sign up)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Name (optional)"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          {mode === "signup" && (
            <React.Fragment>
              <TextInput
                style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </React.Fragment>
          )}

          {mode === "signin" && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => setMode("forgot-password")}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>{forgotPasswordText}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton, 
              (loading || (mode === "signup" && !isFormValid)) && styles.buttonDisabled
            ]}
            onPress={handleEmailAuth}
            disabled={loading || (mode === "signup" && !isFormValid)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={handleSwitchMode}
            disabled={loading}
          >
            <Text style={styles.switchModeText}>{switchModeText}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{dividerText}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, loading && styles.buttonDisabled]}
            onPress={() => handleSocialAuth("google")}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>{googleButtonText}</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
              onPress={() => handleSocialAuth("apple")}
              disabled={loading}
            >
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                {appleButtonText}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>{termsText}</Text>
            <TouchableOpacity onPress={handleOpenTerms}>
              <Text style={styles.termsLink}>{termsLinkText}</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>{andText}</Text>
            <TouchableOpacity onPress={handleOpenPrivacy}>
              <Text style={styles.termsLink}>{privacyLinkText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notice</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
    color: "#666",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  inputError: {
    borderColor: "#ff3b30",
    marginBottom: 4,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
    paddingHorizontal: 4,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 8,
    padding: 4,
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  primaryButton: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchModeButton: {
    marginTop: 16,
    padding: 8,
    alignItems: "center",
  },
  switchModeText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#666",
    fontSize: 14,
  },
  socialButton: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  socialButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  appleButton: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  appleButtonText: {
    color: "#fff",
  },
  termsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  termsLink: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#000",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
