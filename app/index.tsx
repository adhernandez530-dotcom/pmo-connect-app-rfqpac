
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, loading } = useFirebaseAuth();

  useEffect(() => {
    console.log('[Index] User state:', user ? 'authenticated' : 'not authenticated');
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary || '#007AFF'} />
      </View>
    );
  }

  // Redirect to appropriate screen based on auth state
  if (user) {
    console.log('[Index] User authenticated, redirecting to home');
    return <Redirect href="/(tabs)/(home)" />;
  }

  console.log('[Index] User not authenticated, redirecting to firebase-auth');
  return <Redirect href="/firebase-auth" />;
}
