
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 48,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  appleButton: {
    width: "100%",
    backgroundColor: "#000000",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  appleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    fontSize: 14,
    color: colors.textSecondary,
    marginVertical: 24,
  },
  link: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 16,
  },
  linkSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
