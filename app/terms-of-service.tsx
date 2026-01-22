
import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";

export default function TermsOfServiceScreen() {
  const title = 'Terms of Service';
  const lastUpdated = 'Last Updated: January 2025';
  
  const acceptanceTitle = '1. Acceptance of Terms';
  const acceptanceText = 'By accessing and using PUT ME ON (PMO), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.';
  
  const descriptionTitle = '2. Description of Service';
  const descriptionText = 'PUT ME ON is a social platform that helps you discover and connect with people based on the services they offer and topics they are passionate about. The platform allows users to showcase skills, search for talent, share work, and connect with others.';
  
  const userAccountTitle = '3. User Accounts';
  const userAccountText = 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.';
  
  const userConductTitle = '4. User Conduct';
  const userConductText = 'You agree not to use the service to post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable. You also agree not to impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity.';
  
  const contentTitle = '5. User Content';
  const contentText = 'You retain all rights to the content you post on PUT ME ON. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with the service. You are solely responsible for the content you post.';
  
  const privacyTitle = '6. Privacy';
  const privacyText = 'Your use of the service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your information.';
  
  const terminationTitle = '7. Termination';
  const terminationText = 'We reserve the right to terminate or suspend your account and access to the service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.';
  
  const disclaimerTitle = '8. Disclaimer of Warranties';
  const disclaimerText = 'The service is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the service, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.';
  
  const limitationTitle = '9. Limitation of Liability';
  const limitationText = 'In no event shall PUT ME ON be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.';
  
  const changesTitle = '10. Changes to Terms';
  const changesText = 'We reserve the right to modify these Terms of Service at any time. We will notify you of any changes by posting the new Terms of Service on this page and updating the "Last Updated" date. Your continued use of the service after such changes constitutes your acceptance of the new terms.';
  
  const contactTitle = '11. Contact Information';
  const contactText = 'If you have any questions about these Terms of Service, please contact us through the app or at support@putmeon.com.';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Terms of Service',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.lastUpdated}>{lastUpdated}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{acceptanceTitle}</Text>
            <Text style={styles.sectionText}>{acceptanceText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{descriptionTitle}</Text>
            <Text style={styles.sectionText}>{descriptionText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{userAccountTitle}</Text>
            <Text style={styles.sectionText}>{userAccountText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{userConductTitle}</Text>
            <Text style={styles.sectionText}>{userConductText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{contentTitle}</Text>
            <Text style={styles.sectionText}>{contentText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{privacyTitle}</Text>
            <Text style={styles.sectionText}>{privacyText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{terminationTitle}</Text>
            <Text style={styles.sectionText}>{terminationText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{disclaimerTitle}</Text>
            <Text style={styles.sectionText}>{disclaimerText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{limitationTitle}</Text>
            <Text style={styles.sectionText}>{limitationText}</Text>
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
  sectionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  bottomPadding: {
    height: 40,
  },
});
