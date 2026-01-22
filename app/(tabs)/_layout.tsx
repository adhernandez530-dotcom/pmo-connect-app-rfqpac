
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'feed',
      route: '/(tabs)/feed',
      icon: 'rss-feed',
      label: 'Feed',
    },
    {
      name: 'messages',
      route: '/(tabs)/messages',
      icon: 'message',
      label: 'Messages',
    },
    {
      name: 'search',
      route: '/(tabs)/search',
      icon: 'search',
      label: 'Search',
    },
  ];

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="feed" name="feed" />
        <Stack.Screen key="messages" name="messages" />
        <Stack.Screen key="search" name="search" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
