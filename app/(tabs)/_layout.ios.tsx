
import React from 'react';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';
import { authenticatedFetch } from '@/utils/api';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev';

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    console.log('iOS TabLayout: Loading unread notification count');
    loadUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/notifications/unread-count`);
      const data = await response.json();
      console.log('iOS TabLayout: Unread notification count:', data.count);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('iOS TabLayout: Error loading unread count:', error);
    }
  };

  const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feed">
        <Label>Feed</Label>
        <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} drawable="rss-feed" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Label>Messages</Label>
        <Icon sf={{ default: 'message', selected: 'message.fill' }} drawable="message" />
        {unreadCount > 0 && <Badge>{badgeText}</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Label>Search</Label>
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} drawable="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
