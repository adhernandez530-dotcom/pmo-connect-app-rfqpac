// WelcomeScreen.tsx
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function WelcomeScreen({ navigation }: any) {
  const { signInWithGoogle, signInWithApple } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PutMeOn</Text>

      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Discover what your friends are into.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={signInWithGoogle}>
        <Text style={styles.primaryText}>Continue with Google</Text>
      </TouchableOpacity>

      {Platform.OS === "ios" && (
        <TouchableOpacity style={styles.appleButton} onPress={signInWithApple}>
          <Text style={styles.appleText}>Continue with Apple</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.divider}>or</Text>

      <TouchableOpacity onPress={() => navigation.navigate("EmailAuth", { mode: "signup" })}>
        <Text style={styles.link}>Sign up with Email</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("EmailAuth", { mode: "signin" })}>
        <Text style={styles.linkSecondary}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}
