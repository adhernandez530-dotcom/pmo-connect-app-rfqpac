
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { colors } from '@/styles/commonStyles';
import Constants from 'expo-constants';

export default function TestFirebaseScreen() {
  const [status, setStatus] = useState<string>('Checking Firebase connection...');
  const [user, setUser] = useState<any>(null);
  const [testEmail] = useState(`test${Date.now()}@example.com`);
  const [testPassword] = useState('TestPassword123!');

  useEffect(() => {
    console.log('🔥 Firebase Test: Component mounted');
    checkFirebaseConnection();

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log('🔥 Firebase Test: Auth state changed:', currentUser?.email || 'No user');
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const checkFirebaseConnection = () => {
    const config = Constants.expoConfig?.extra;
    const configStatus = `
Firebase Configuration:
- API Key: ${config?.firebaseApiKey?.substring(0, 20)}...
- Project ID: ${config?.firebaseProjectId}
- Auth Domain: ${config?.firebaseAuthDomain}

Auth Instance: ${auth ? '✅ Initialized' : '❌ Not initialized'}
Current User: ${auth.currentUser?.email || 'None'}
    `.trim();

    setStatus(configStatus);
    console.log('🔥 Firebase Test: Configuration check complete');
  };

  const handleTestSignUp = async () => {
    console.log('🔥 Firebase Test: Testing sign up with:', testEmail);
    setStatus('Testing sign up...');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const successMessage = `✅ Sign Up Success!\nEmail: ${userCredential.user.email}\nUID: ${userCredential.user.uid}`;
      setStatus(successMessage);
      console.log('🔥 Firebase Test: Sign up successful:', userCredential.user.uid);
    } catch (error: any) {
      const errorMessage = `❌ Sign Up Error:\n${error.code}\n${error.message}`;
      setStatus(errorMessage);
      console.error('🔥 Firebase Test: Sign up error:', error);
    }
  };

  const handleTestSignIn = async () => {
    console.log('🔥 Firebase Test: Testing sign in with:', testEmail);
    setStatus('Testing sign in...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const successMessage = `✅ Sign In Success!\nEmail: ${userCredential.user.email}\nUID: ${userCredential.user.uid}`;
      setStatus(successMessage);
      console.log('🔥 Firebase Test: Sign in successful:', userCredential.user.uid);
    } catch (error: any) {
      const errorMessage = `❌ Sign In Error:\n${error.code}\n${error.message}`;
      setStatus(errorMessage);
      console.error('🔥 Firebase Test: Sign in error:', error);
    }
  };

  const handleTestSignOut = async () => {
    console.log('🔥 Firebase Test: Testing sign out');
    setStatus('Testing sign out...');
    try {
      await signOut(auth);
      setStatus('✅ Sign Out Success!');
      console.log('🔥 Firebase Test: Sign out successful');
    } catch (error: any) {
      const errorMessage = `❌ Sign Out Error:\n${error.code}\n${error.message}`;
      setStatus(errorMessage);
      console.error('🔥 Firebase Test: Sign out error:', error);
    }
  };

  const currentUserEmail = user?.email || 'Not signed in';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Firebase Connection Test',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🔥 Firebase Connection Test</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current User</Text>
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{currentUserEmail}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Authentication</Text>
            <Text style={styles.instructions}>
              These buttons will test Firebase authentication with a random test account.
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleTestSignUp}>
              <Text style={styles.buttonText}>1. Test Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleTestSignIn}>
              <Text style={styles.buttonText}>2. Test Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleTestSignOut}>
              <Text style={styles.buttonText}>3. Test Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshButton} onPress={checkFirebaseConnection}>
              <Text style={styles.refreshButtonText}>Refresh Status</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Setup Instructions</Text>
            <Text style={styles.instructions}>
              1. Remove conflicting packages:{'\n'}
              npm uninstall @react-native-firebase/app @react-native-firebase/auth @bacons/apple-targets
              {'\n\n'}
              2. Get Firebase config from Firebase Console{'\n'}
              3. Update app.json with your Firebase credentials{'\n'}
              4. Enable Email/Password auth in Firebase Console{'\n'}
              5. Run this test to verify connection
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expected Results</Text>
            <Text style={styles.instructions}>
              ✅ Sign Up: Creates a new test user{'\n'}
              ✅ Sign In: Signs in with the test user{'\n'}
              ✅ Sign Out: Signs out the current user{'\n\n'}
              If you see errors, check:{'\n'}
              - Firebase config in app.json is correct{'\n'}
              - Email/Password auth is enabled in Firebase Console{'\n'}
              - No conflicting React Native Firebase packages installed
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  statusBox: {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
  },
  instructions: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
