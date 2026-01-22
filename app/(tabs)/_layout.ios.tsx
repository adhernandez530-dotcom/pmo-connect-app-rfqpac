
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
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
      <NativeTabs.Trigger name="friends">
        <Label>Friends</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} drawable="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Label>Messages</Label>
        <Icon sf={{ default: 'message', selected: 'message.fill' }} drawable="message" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Label>Search</Label>
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} drawable="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
