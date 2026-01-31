
import React, { useState, useEffect } from "react";
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
import { apiGet } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";

type Mode = "signin" | "signup" | "forgot-password";

interface OAuthProvider {
  enabled: boolean;
  configured: boolean;
  setupUrl?: string;
  docsUrl?: string;
}

interface OAuthConfig {
  google?: OAuthProvider;
  apple?: OAuthProvider;
}

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
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  
  // Validation states
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // OAuth config state
  const [oauthConfigChecked, setOauthConfigChecked] = useState(false);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);
  
  // OAuth setup modal state
  const [showOAuthSetupModal, setShowOAuthSetupModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"google" | "apple" | null>(null);

  // Check OAuth configuration on mount
  useEffect(() => {
    const checkOAuthConfig = async () => {
      try {
        console.log("🔍 Checking OAuth configuration...");
        const config = await apiGet("/api/oauth/config");
        console.log("✅ OAuth config:", config);
        setOauthConfig(config);
        setOauthConfigChecked(true);
        
        // Also log additional OAuth debug info in development
        if (__DEV__) {
          try {
            const status = await apiGet("/api/oauth/status");
            console.log("📊 OAuth status:", status);
            
            const providers = await apiGet("/api/oauth/providers");
            console.log("🔌 OAuth providers:", providers);
            
            const callbackUrls = await apiGet("/api/oauth/callback-urls");
            console.log("🔗 OAuth callback URLs:", callbackUrls);
          } catch (debugError) {
            console.log("ℹ️ OAuth debug endpoints not available:", debugError);
          }
        }
      } catch (error) {
        console.error("❌ Failed to check OAuth config:", error);
        // If endpoint doesn't exist, assume OAuth is not configured
        setOauthConfig({ 
          google: { enabled: false, configured: false }, 
          apple: { enabled: false, configured: false } 
        });
        setOauthConfigChecked(true);
      }
    };
    
    checkOAuthConfig();
  }, []);

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
    console.log("🔵 User tapped email auth button - mode:", mode);
    console.log("🔵 Email:", email, "Password length:", password.length);
    
    if (!email || !password) {
      console.log("❌ Validation failed: Missing email or password");
      showError("Please enter email and password");
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      console.log("❌ Validation failed: Password too short");
      return;
    }

    // Validate confirm password in signup mode
    if (mode === "signup") {
      if (!confirmPassword) {
        console.log("❌ Validation failed: Missing confirm password");
        showError("Please confirm your password");
        return;
      }
      if (!validateConfirmPassword(password, confirmPassword)) {
        console.log("❌ Validation failed: Passwords don't match");
        return;
      }
    }

    console.log("✅ Validation passed, starting authentication");
    setLoading(true);
    try {
      if (mode === "signin") {
        console.log("🔐 Calling signInWithEmail for:", email);
        await signInWithEmail(email, password);
        console.log("✅ Sign in successful - root layout will handle navigation");
      } else {
        console.log("📝 Calling signUpWithEmail for:", email, "(name will be set in onboarding)");
        await signUpWithEmail(email, password, undefined);
        console.log("✅ Sign up successful - root layout will redirect to email verification");
      }
    } catch (error: any) {
      console.error("❌ Authentication error:", error);
      const errorMsg = error.message || error.toString() || "Authentication failed";
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    console.log("🔵 User tapped forgot password");
    
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
      console.error("❌ Forgot password error:", error);
      showError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple") => {
    console.log("🔵 User tapped social auth button - provider:", provider);
    console.log("🔵 Platform:", Platform.OS);
    console.log("🔵 OAuth config:", oauthConfig);
    
    // Check if OAuth is configured
    const providerConfig = oauthConfig?.[provider];
    if (providerConfig && !providerConfig.enabled) {
      console.log("⚠️ OAuth provider not configured:", provider);
      setSelectedProvider(provider);
      setShowOAuthSetupModal(true);
      return;
    }
    
    setOauthLoading(true);
    
    // Set a timeout to prevent getting stuck on loading screen
    const timeoutId = setTimeout(() => {
      console.log("⏱️ OAuth timeout - resetting loading state");
      setOauthLoading(false);
      showError("The authentication process is taking longer than expected. Please try again or use email sign in.");
    }, 30000); // 30 second timeout
    
    try {
      console.log("🚀 Starting", provider, "sign in flow");
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "apple") {
        await signInWithApple();
      }
      console.log("✅ Social auth initiated");
      clearTimeout(timeoutId);
    } catch (error: any) {
      console.error("❌ Social auth error:", error);
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
    console.log("🔵 User tapped switch mode button - current mode:", mode);
    const newMode = mode === "signin" ? "signup" : "signin";
    setMode(newMode);
    setPasswordError("");
    setConfirmPasswordError("");
    console.log("✅ Switched to mode:", newMode);
  };

  const handleOpenTerms = () => {
    console.log("🔵 User tapped Terms of Service link");
    Linking.openURL("https://putmeon.app/terms");
  };

  const handleOpenPrivacy = () => {
    console.log("🔵 User tapped Privacy Policy link");
    Linking.openURL("https://putmeon.app/privacy");
  };

  const handleOAuthTroubleshoot = async () => {
    console.log("🔵 User tapped OAuth Troubleshoot button");
    setLoading(true);
    try {
      const troubleshoot = await apiGet("/api/oauth/troubleshoot");
      console.log("🔧 OAuth troubleshoot results:", troubleshoot);
      
      // Format the troubleshoot data for display
      const message = JSON.stringify(troubleshoot, null, 2);
      showError(`OAuth Troubleshoot Results:\n\n${message}`);
    } catch (error: any) {
      console.error("❌ OAuth troubleshoot failed:", error);
      showError("Failed to run OAuth troubleshoot. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSetupGuide = (provider: "google" | "apple") => {
    console.log("🔵 User tapped setup guide for:", provider);
    const urls = {
      google: "https://console.cloud.google.com/apis/credentials",
      apple: "https://developer.apple.com/account/resources/identifiers/list/serviceId"
    };
    Linking.openURL(urls[provider]);
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
  
  console.log("🎨 AuthScreen: Rendering auth screen - mode:", mode, "loading:", loading, "oauthLoading:", oauthLoading);

  // Show OAuth loading state with cancel button
  if (oauthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{oauthLoadingText}</Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            console.log("🔵 User cancelled OAuth loading");
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
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                console.log("🔵 User tapped back to sign in");
                setMode("signin");
              }}
              disabled={loading}
              activeOpacity={0.7}
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
                onPress={() => {
                  console.log("🔵 User dismissed error modal");
                  setErrorModalVisible(false);
                }}
                activeOpacity={0.7}
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
              onPress={() => {
                console.log("🔵 User tapped forgot password link");
                setMode("forgot-password");
              }}
              disabled={loading}
              activeOpacity={0.7}
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
            activeOpacity={0.7}
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
            activeOpacity={0.7}
          >
            <Text style={styles.switchModeText}>{switchModeText}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{dividerText}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth Button */}
          <TouchableOpacity
            style={[styles.socialButton, (loading || oauthLoading) && styles.buttonDisabled]}
            onPress={() => {
              console.log("🔵 Google button pressed - starting OAuth flow");
              console.log("🔵 OAuth config:", oauthConfig);
              handleSocialAuth("google");
            }}
            disabled={loading || oauthLoading}
            activeOpacity={0.7}
          >
            <View style={styles.socialButtonContent}>
              <IconSymbol 
                ios_icon_name="g.circle.fill" 
                android_material_icon_name="g-translate" 
                size={20} 
                color="#4285F4" 
              />
              <Text style={styles.socialButtonText}>{googleButtonText}</Text>
            </View>
            {oauthConfigChecked && oauthConfig?.google && !oauthConfig.google.enabled && (
              <View style={styles.setupBadge}>
                <IconSymbol 
                  ios_icon_name="exclamationmark.circle.fill" 
                  android_material_icon_name="info" 
                  size={14} 
                  color="#FF9500" 
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Apple OAuth Button (iOS only) */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton, (loading || oauthLoading) && styles.buttonDisabled]}
              onPress={() => {
                console.log("🔵 Apple button pressed - starting OAuth flow");
                console.log("🔵 OAuth config:", oauthConfig);
                handleSocialAuth("apple");
              }}
              disabled={loading || oauthLoading}
              activeOpacity={0.7}
            >
              <View style={styles.socialButtonContent}>
                <IconSymbol 
                  ios_icon_name="apple.logo" 
                  android_material_icon_name="apple" 
                  size={20} 
                  color="#fff" 
                />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  {appleButtonText}
                </Text>
              </View>
              {oauthConfigChecked && oauthConfig?.apple && !oauthConfig.apple.enabled && (
                <View style={[styles.setupBadge, { backgroundColor: 'rgba(255, 149, 0, 0.2)' }]}>
                  <IconSymbol 
                    ios_icon_name="exclamationmark.circle.fill" 
                    android_material_icon_name="info" 
                    size={14} 
                    color="#FF9500" 
                  />
                </View>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>{termsText}</Text>
            <TouchableOpacity onPress={handleOpenTerms} activeOpacity={0.7}>
              <Text style={styles.termsLink}>{termsLinkText}</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>{andText}</Text>
            <TouchableOpacity onPress={handleOpenPrivacy} activeOpacity={0.7}>
              <Text style={styles.termsLink}>{privacyLinkText}</Text>
            </TouchableOpacity>
          </View>

          {/* Developer OAuth Troubleshoot Button (only in dev mode) */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.troubleshootButton}
              onPress={handleOAuthTroubleshoot}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.troubleshootButtonText}>🔧 OAuth Troubleshoot (Dev Only)</Text>
            </TouchableOpacity>
          )}
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
              onPress={() => {
                console.log("🔵 User dismissed error modal");
                setErrorModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OAuth Setup Modal */}
      <Modal
        visible={showOAuthSetupModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowOAuthSetupModal(false);
          setSelectedProvider(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.setupModalContent}>
            <View style={styles.setupModalHeader}>
              <IconSymbol 
                ios_icon_name="exclamationmark.triangle.fill" 
                android_material_icon_name="warning" 
                size={48} 
                color="#FF9500" 
              />
              <Text style={styles.setupModalTitle}>
                {selectedProvider === "google" ? "Google" : "Apple"} Sign-In Not Available
              </Text>
              <Text style={styles.setupModalSubtitle}>
                This authentication method hasn&apos;t been set up yet
              </Text>
            </View>

            <View style={styles.setupModalBody}>
              <View style={styles.setupInfoCard}>
                <IconSymbol 
                  ios_icon_name="info.circle.fill" 
                  android_material_icon_name="info" 
                  size={20} 
                  color="#007AFF" 
                />
                <Text style={styles.setupInfoText}>
                  {selectedProvider === "google" 
                    ? "To enable Google Sign-In, the app administrator needs to configure OAuth credentials in the Google Cloud Console."
                    : "To enable Apple Sign-In, the app administrator needs to configure Sign in with Apple in the Apple Developer Portal."}
                </Text>
              </View>

              <View style={styles.setupStepsContainer}>
                <Text style={styles.setupStepsTitle}>What you can do:</Text>
                
                <View style={styles.setupStep}>
                  <View style={styles.setupStepNumber}>
                    <Text style={styles.setupStepNumberText}>1</Text>
                  </View>
                  <View style={styles.setupStepContent}>
                    <Text style={styles.setupStepTitle}>Use Email Sign-In</Text>
                    <Text style={styles.setupStepDescription}>
                      Sign in with your email and password instead
                    </Text>
                  </View>
                </View>

                <View style={styles.setupStep}>
                  <View style={styles.setupStepNumber}>
                    <Text style={styles.setupStepNumberText}>2</Text>
                  </View>
                  <View style={styles.setupStepContent}>
                    <Text style={styles.setupStepTitle}>Contact Support</Text>
                    <Text style={styles.setupStepDescription}>
                      Ask the app administrator to enable {selectedProvider === "google" ? "Google" : "Apple"} authentication
                    </Text>
                  </View>
                </View>

                {__DEV__ && (
                  <View style={styles.setupStep}>
                    <View style={styles.setupStepNumber}>
                      <Text style={styles.setupStepNumberText}>3</Text>
                    </View>
                    <View style={styles.setupStepContent}>
                      <Text style={styles.setupStepTitle}>Setup Guide (Developers)</Text>
                      <Text style={styles.setupStepDescription}>
                        View the setup documentation
                      </Text>
                      <TouchableOpacity
                        style={styles.setupGuideButton}
                        onPress={() => {
                          handleOpenSetupGuide(selectedProvider!);
                          setShowOAuthSetupModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.setupGuideButtonText}>
                          Open {selectedProvider === "google" ? "Google Cloud Console" : "Apple Developer Portal"}
                        </Text>
                        <IconSymbol 
                          ios_icon_name="arrow.up.right" 
                          android_material_icon_name="open-in-new" 
                          size={16} 
                          color="#007AFF" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.setupModalFooter}>
              <TouchableOpacity
                style={styles.setupModalButton}
                onPress={() => {
                  console.log("🔵 User dismissed OAuth setup modal");
                  setShowOAuthSetupModal(false);
                  setSelectedProvider(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.setupModalButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
    position: "relative",
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  setupBadge: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
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
    padding: 20,
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
  troubleshootButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  troubleshootButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  setupModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    maxHeight: "90%",
    position: "absolute",
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  setupModalHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  setupModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginTop: 16,
    textAlign: "center",
  },
  setupModalSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  setupModalBody: {
    padding: 24,
  },
  setupInfoCard: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  setupInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  setupStepsContainer: {
    gap: 16,
  },
  setupStepsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  setupStep: {
    flexDirection: "row",
    gap: 12,
  },
  setupStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  setupStepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  setupStepContent: {
    flex: 1,
  },
  setupStepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  setupStepDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  setupGuideButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  setupGuideButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  setupModalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  setupModalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  setupModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
