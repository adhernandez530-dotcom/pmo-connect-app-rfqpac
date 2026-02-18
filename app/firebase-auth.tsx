
import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

type Mode = 'signin' | 'signup';

export default function FirebaseAuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loading: authLoading } = useFirebaseAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary || '#007AFF'} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        console.log('User tapped Sign In button');
        await signInWithEmail(email, password);
        console.log('Sign in successful, navigating to onboarding');
        router.replace('/onboarding');
      } else {
        console.log('User tapped Sign Up button');
        await signUpWithEmail(email, password, name);
        console.log('Sign up successful, navigating to onboarding');
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      showError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('User tapped Google Sign In button');
      await signInWithGoogle();
      console.log('Google sign in successful, navigating to onboarding');
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      showError(error.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const modeText = mode === 'signin' ? 'Sign In' : 'Sign Up';
  const switchModeText = mode === 'signin' 
    ? "Don't have an account? Sign Up" 
    : 'Already have an account? Sign In';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="person.circle.fill"
              android_material_icon_name="account-circle"
              size={80}
              color={colors.primary || '#007AFF'}
            />
            <Text style={[styles.title, { color: colors.text }]}>{modeText}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary || '#666' }]}>
              Welcome to PMO Connect
            </Text>
          </View>

          {mode === 'signup' && (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border || '#ddd' }]}
              placeholder="Name (optional)"
              placeholderTextColor={colors.textSecondary || '#999'}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border || '#ddd' }]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary || '#999'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border || '#ddd' }]}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={colors.textSecondary || '#999'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary || '#007AFF' },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{modeText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            <Text style={[styles.switchModeText, { color: colors.primary || '#007AFF' }]}>
              {switchModeText}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border || '#ddd' }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary || '#666' }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border || '#ddd' }]} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, { borderColor: colors.border || '#ddd' }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <IconSymbol
              ios_icon_name="globe"
              android_material_icon_name="language"
              size={24}
              color={colors.text}
            />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color="#FF3B30"
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Error</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary || '#007AFF' }]}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  socialButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
