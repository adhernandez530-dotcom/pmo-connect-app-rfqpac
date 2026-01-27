
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Linking,
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

  if (authLoading) {
    const loadingText = "Loading...";
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

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
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      return;
    }

    // Validate confirm password in signup mode
    if (mode === "signup") {
      if (!confirmPassword) {
        Alert.alert("Error", "Please confirm your password");
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
      const errorMessage = error.message || error.toString() || "Authentication failed";
      
      // Show user-friendly error message
      Alert.alert(
        "Authentication Error", 
        errorMessage,
        [
          {
            text: "OK",
            onPress: () => console.log("User dismissed auth error alert")
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    console.log("User tapped forgot password");
    
    if (!email) {
      Alert.alert(
        "Email Required", 
        "Please enter your email address to reset your password.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert(
        "Check Your Email",
        "If an account exists for this email, we've sent a reset link.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("User acknowledged password reset email");
              setMode("signin");
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Forgot password error:", error);
      Alert.alert(
        "Error",
        "Failed to send password reset email. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple") => {
    console.log("User tapped social auth button - provider:", provider);
    setOauthLoading(true);
    try {
      console.log("Starting", provider, "sign in flow");
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "apple") {
        await signInWithApple();
      }
      // Note: On web, the page will redirect to the OAuth provider
      // On native, the flow will complete and fetchUser will be called
      console.log("Social auth initiated");
    } catch (error: any) {
      console.error("Social auth error:", error);
      setOauthLoading(false);
      const errorMessage = error.message || error.toString() || "Authentication failed";
      
      // Only show alert if there's an actual error (not user cancellation)
      if (!errorMessage.includes("cancelled") && !errorMessage.includes("canceled")) {
        Alert.alert(
          "Authentication Error", 
          errorMessage,
          [
            {
              text: "OK",
              onPress: () => console.log("User dismissed social auth error alert")
            }
          ]
        );
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
  
  // Log authentication state for debugging
  console.log("AuthScreen: Rendering auth screen - mode:", mode, "loading:", loading, "oauthLoading:", oauthLoading);

  // Show OAuth loading state
  if (oauthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{oauthLoadingText}</Text>
      </View>
    );
  }

  if (mode === "forgot-password") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
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
              <Text style={styles.switchModeText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Name (optional)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
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
});
