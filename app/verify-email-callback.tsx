
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { apiCall } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

type Status = "processing" | "success" | "error";

export default function VerifyEmailCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  const { fetchUser } = useAuth();

  const [status, setStatus] = useState<Status>("processing");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      console.error("VerifyEmailCallback: No token provided");
      setStatus("error");
      setMessage("Invalid verification link. Please request a new one.");
      return;
    }

    const handleVerification = async () => {
      try {
        console.log("VerifyEmailCallback: Verifying email with token");
        
        // Call backend to verify email
        await apiCall(`/api/auth/verify-email/${token}`, {
          method: "GET",
        });

        console.log("VerifyEmailCallback: Email verified successfully");
        setStatus("success");
        setMessage("Email verified successfully! You can now access all features.");

        // Refresh user session to get updated emailVerified status
        await fetchUser();

        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.replace("/(tabs)/(home)");
        }, 2000);
      } catch (error: any) {
        console.error("VerifyEmailCallback: Verification failed:", error);
        
        let errorMessage = "Failed to verify email. Please try again.";
        
        if (error?.message?.includes("expired") || error?.message?.includes("invalid")) {
          errorMessage = "This verification link has expired or is invalid. Please request a new one.";
        } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        setStatus("error");
        setMessage(errorMessage);
      }
    };

    handleVerification();
  }, [token, fetchUser, router]);

  const handleVerification = async () => {
    try {
      console.log("VerifyEmailCallback: Verifying email with token");
      
      // Call backend to verify email
      await apiCall(`/api/auth/verify-email/${token}`, {
        method: "GET",
      });

      console.log("VerifyEmailCallback: Email verified successfully");
      setStatus("success");
      setMessage("Email verified successfully! You can now access all features.");

      // Refresh user session to get updated emailVerified status
      await fetchUser();

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.replace("/(tabs)/(home)");
      }, 2000);
    } catch (error: any) {
      console.error("VerifyEmailCallback: Verification failed:", error);
      
      let errorMessage = "Failed to verify email. Please try again.";
      
      if (error?.message?.includes("expired") || error?.message?.includes("invalid")) {
        errorMessage = "This verification link has expired or is invalid. Please request a new one.";
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setStatus("error");
      setMessage(errorMessage);
    }
  };

  const handleGoToVerifyScreen = () => {
    router.replace("/verify-email");
  };

  const handleGoToHome = () => {
    router.replace("/(tabs)/(home)");
  };

  const processingText = "Verifying your email...";
  const successIcon = "✓";
  const errorIcon = "✗";
  const requestNewLinkText = "Request New Link";
  const goToHomeText = "Go to Home";

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          title: "Email Verification",
          headerShown: true,
          headerBackVisible: false,
        }}
      />
      <View style={styles.container}>
        {status === "processing" && (
          <React.Fragment>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.message}>{processingText}</Text>
          </React.Fragment>
        )}
        
        {status === "success" && (
          <React.Fragment>
            <View style={styles.iconContainer}>
              <Text style={styles.successIcon}>{successIcon}</Text>
            </View>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGoToHome}
            >
              <Text style={styles.buttonText}>{goToHomeText}</Text>
            </TouchableOpacity>
          </React.Fragment>
        )}
        
        {status === "error" && (
          <React.Fragment>
            <View style={styles.iconContainer}>
              <Text style={styles.errorIcon}>{errorIcon}</Text>
            </View>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGoToVerifyScreen}
            >
              <Text style={styles.buttonText}>{requestNewLinkText}</Text>
            </TouchableOpacity>
          </React.Fragment>
        )}
      </View>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    color: "#34C759",
  },
  errorIcon: {
    fontSize: 48,
    color: "#FF3B30",
  },
  message: {
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
    color: "#333",
    lineHeight: 26,
    maxWidth: 400,
  },
  button: {
    marginTop: 32,
    height: 50,
    paddingHorizontal: 32,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
