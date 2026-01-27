
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Platform } from "react-native";

type Status = "processing" | "success" | "error";

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<Status>("processing");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    if (Platform.OS !== "web") {
      console.log("AuthCallback: Not on web platform, skipping");
      return;
    }
    
    console.log("AuthCallback: Handling OAuth callback");
    handleCallback();
  }, []);

  const handleCallback = () => {
    try {
      console.log("AuthCallback: Parsing URL parameters");
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (error) {
        const errorMsg = errorDescription || error;
        console.error("AuthCallback: OAuth error:", errorMsg);
        setStatus("error");
        setMessage(`Authentication failed: ${errorMsg}`);
        
        // Send error to opener window
        if (window.opener && !window.opener.closed) {
          console.log("AuthCallback: Sending error to opener window");
          window.opener.postMessage({ type: "oauth-error", error: errorMsg }, "*");
        }
        
        // Close window after showing error
        setTimeout(() => {
          console.log("AuthCallback: Closing window after error");
          window.close();
        }, 2000);
        return;
      }

      // Better Auth uses session cookies, so we just need to signal success
      console.log("AuthCallback: OAuth successful, session should be set via cookies");
      setStatus("success");
      setMessage("Authentication successful! Closing...");
      
      // Send success to opener window
      if (window.opener && !window.opener.closed) {
        console.log("AuthCallback: Sending success to opener window");
        window.opener.postMessage({ type: "oauth-success" }, "*");
      } else {
        console.warn("AuthCallback: Opener window not available");
      }
      
      // Close window after short delay
      setTimeout(() => {
        console.log("AuthCallback: Closing window after success");
        window.close();
      }, 1000);
    } catch (err: any) {
      console.error("AuthCallback: Error processing callback:", err);
      setStatus("error");
      setMessage("Failed to process authentication");
      
      // Send error to opener window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ 
          type: "oauth-error", 
          error: err.message || "Processing failed" 
        }, "*");
      }
      
      // Close window after showing error
      setTimeout(() => {
        console.log("AuthCallback: Closing window after processing error");
        window.close();
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      {status === "processing" && <ActivityIndicator size="large" color="#007AFF" />}
      {status === "success" && <Text style={styles.successIcon}>✓</Text>}
      {status === "error" && <Text style={styles.errorIcon}>✗</Text>}
      <Text style={styles.message}>{message}</Text>
      {status === "error" && (
        <Text style={styles.subMessage}>This window will close automatically...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  successIcon: {
    fontSize: 48,
    color: "#34C759",
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
    color: "#FF3B30",
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
    color: "#333",
  },
  subMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    color: "#666",
  },
});
