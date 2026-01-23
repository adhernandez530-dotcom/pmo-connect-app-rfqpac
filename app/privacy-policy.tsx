
import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";

export default function PrivacyPolicyScreen() {
  const title = 'Privacy Policy';
  const lastUpdated = 'Last Updated: January 2025';
  
  const introTitle = '1. Introduction';
  const introText = 'Welcome to PUT ME ON (PMO). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.';
  
  const infoCollectionTitle = '2. Information We Collect';
  const infoCollectionSubtitle1 = 'Personal Information';
  const infoCollectionText1 = 'We collect information that you provide directly to us, including your name, email address, username, profile picture, location, bio, and the services you offer.';
  const infoCollectionSubtitle2 = 'Usage Information';
  const infoCollectionText2 = 'We automatically collect information about your interactions with the app, including posts, messages, friend connections, and search queries.';
  
  const useOfInfoTitle = '3. How We Use Your Information';
  const useOfInfoText = 'We use the information we collect to provide, maintain, and improve our services, including to connect you with other users based on mutual friends and shared interests, display your profile and services to other users, facilitate messaging and collaboration, and send you notifications about friend requests, messages, and other activities.';
  
  const sharingTitle = '4. Information Sharing';
  const sharingText = 'We share your information with other users as part of the core functionality of the app. Your profile, services, and posts are visible to your friends and, depending on your privacy settings, to other users. We do not sell your personal information to third parties.';
  
  const securityTitle = '5. Data Security';
  const securityText = 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.';
  
  const rightsTitle = '6. Your Rights';
  const rightsText = 'You have the right to access, update, or delete your personal information at any time through your account settings. You can also deactivate your account, which will hide your profile from other users.';
  
  const changesTitle = '7. Changes to This Policy';
  const changesText = 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.';
  
  const contactTitle = '8. Contact Us';
  const contactText = 'If you have any questions about this Privacy Policy, please contact us through the app or at adhernandez530@gmail.com.';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.lastUpdated}>{lastUpdated}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{introTitle}</Text>
            <Text style={styles.sectionText}>{introText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{infoCollectionTitle}</Text>
            <Text style={styles.subsectionTitle}>{infoCollectionSubtitle1}</Text>
            <Text style={styles.sectionText}>{infoCollectionText1}</Text>
            <Text style={styles.subsectionTitle}>{infoCollectionSubtitle2}</Text>
            <Text style={styles.sectionText}>{infoCollectionText2}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{useOfInfoTitle}</Text>
            <Text style={styles.sectionText}>{useOfInfoText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sharingTitle}</Text>
            <Text style={styles.sectionText}>{sharingText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{securityTitle}</Text>
            <Text style={styles.sectionText}>{securityText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{rightsTitle}</Text>
            <Text style={styles.sectionText}>{rightsText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{changesTitle}</Text>
            <Text style={styles.sectionText}>{changesText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{contactTitle}</Text>
            <Text style={styles.sectionText}>{contactText}</Text>
          </View>

          <View style={styles.bottomPadding} />
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  bottomPadding: {
    height: 40,
  },
});
