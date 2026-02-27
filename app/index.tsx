
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedGet } from '@/utils/api';

const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('[Index] User state:', user ? 'authenticated' : 'not authenticated');
    
    if (!authLoading && user) {
      checkOnboardingStatus();
    } else if (!authLoading && !user) {
      setCheckingOnboarding(false);
    }
  }, [user, authLoading]);

  const checkOnboardingStatus = async () => {
    console.log('[Index] Checking onboarding status for authenticated user');
    setCheckingOnboarding(true);
    
    try {
      // Always fetch fresh status from backend - use onboardingComplete field
      // The backend returns onboardingComplete: true if username is set (not null)
      const profile = await authenticatedGet<{
        id: string;
        username: string | null;
        onboardingComplete?: boolean;
      }>('/api/profile');
      
      console.log('[Index] Profile response:', profile);
      
      // Use the explicit onboardingComplete field from backend (true if username is not null)
      // Fall back to checking username presence for backwards compatibility
      const isComplete = profile.onboardingComplete ?? (profile.username !== null && profile.username !== '');
      console.log('[Index] Onboarding complete:', isComplete);
      
      // Update AsyncStorage cache to reflect current backend state
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, isComplete ? 'true' : 'false');
      
      setOnboardingComplete(isComplete);
    } catch (error) {
      console.error('[Index] Error checking onboarding status:', error);
      // If API call fails, check AsyncStorage as fallback
      try {
        const cachedStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        console.log('[Index] Using cached onboarding status as fallback:', cachedStatus);
        setOnboardingComplete(cachedStatus === 'true');
      } catch {
        // If everything fails, assume onboarding is not complete to be safe
        setOnboardingComplete(false);
      }
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Show loading indicator while checking auth or onboarding status
  if (authLoading || checkingOnboarding) {
    console.log('[Index] Loading... authLoading:', authLoading, 'checkingOnboarding:', checkingOnboarding);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary || '#007AFF'} />
      </View>
    );
  }

  // Not authenticated - redirect to auth
  if (!user) {
    console.log('[Index] User not authenticated, redirecting to auth');
    return <Redirect href="/auth" />;
  }

  // Authenticated but onboarding not complete - redirect to onboarding
  if (onboardingComplete === false) {
    console.log('[Index] User authenticated but onboarding not complete, redirecting to onboarding');
    return <Redirect href="/onboarding" />;
  }

  // Authenticated and onboarding complete - redirect to home
  console.log('[Index] User authenticated and onboarding complete, redirecting to home');
  return <Redirect href="/(tabs)/(home)" />;
}
