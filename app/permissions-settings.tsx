
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Alert } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Contacts from "expo-contacts";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  photoLibrary: PermissionStatus;
  contacts: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
}

export default function PermissionsSettingsScreen() {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'undetermined',
    microphone: 'undetermined',
    photoLibrary: 'undetermined',
    contacts: 'undetermined',
    location: 'undetermined',
    notifications: 'undetermined',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    console.log('PermissionsSettings: Checking all permissions');
    try {
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      const microphoneStatus = await Camera.getMicrophonePermissionsAsync();
      const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();
      const contactsStatus = await Contacts.getPermissionsAsync();
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const notificationsStatus = await Notifications.getPermissionsAsync();

      setPermissions({
        camera: cameraStatus.status,
        microphone: microphoneStatus.status,
        photoLibrary: mediaLibraryStatus.status,
        contacts: contactsStatus.status,
        location: locationStatus.status,
        notifications: notificationsStatus.status,
      });

      console.log('PermissionsSettings: Current permissions:', {
        camera: cameraStatus.status,
        microphone: microphoneStatus.status,
        photoLibrary: mediaLibraryStatus.status,
        contacts: contactsStatus.status,
        location: locationStatus.status,
        notifications: notificationsStatus.status,
      });

      setLoading(false);
    } catch (error) {
      console.error('PermissionsSettings: Error checking permissions:', error);
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    console.log('PermissionsSettings: User tapped Camera permission');
    try {
      const currentStatus = await Camera.getCameraPermissionsAsync();
      
      if (currentStatus.status === 'granted') {
        Alert.alert('Already Granted', 'Camera permission is already granted');
        return;
      }

      if (currentStatus.canAskAgain === false) {
        Alert.alert(
          'Permission Denied',
          'Camera permission has been denied. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open device settings') },
          ]
        );
        return;
      }

      const result = await Camera.requestCameraPermissionsAsync();
      console.log('PermissionsSettings: Camera permission result:', result.status);
      
      setPermissions(prev => ({ ...prev, camera: result.status }));

      if (result.status === 'granted') {
        Alert.alert('Success', 'Camera permission granted');
      } else {
        Alert.alert('Denied', 'Camera permission was denied');
      }
    } catch (error) {
      console.error('PermissionsSettings: Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const requestMicrophonePermission = async () => {
    console.log('PermissionsSettings: User tapped Microphone permission');
    try {
      const currentStatus = await Camera.getMicrophonePermissionsAsync();
      
      if (currentStatus.status === 'granted') {
        Alert.alert('Already Granted', 'Microphone permission is already granted');
        return;
      }

      if (currentStatus.canAskAgain === false) {
        Alert.alert(
          'Permission Denied',
          'Microphone permission has been denied. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open device settings') },
          ]
        );
        return;
      }

      const result = await Camera.requestMicrophonePermissionsAsync();
      console.log('PermissionsSettings: Microphone permission result:', result.status);
      
      setPermissions(prev => ({ ...prev, microphone: result.status }));

      if (result.status === 'granted') {
        Alert.alert('Success', 'Microphone permission granted');
      } else {
        Alert.alert('Denied', 'Microphone permission was denied');
      }
    } catch (error) {
      console.error('PermissionsSettings: Error requesting microphone permission:', error);
      Alert.alert('Error', 'Failed to request microphone permission');
    }
  };

  const requestPhotoLibraryPermission = async () => {
    console.log('PermissionsSettings: User tapped Photo Library permission');
    try {
      const currentStatus = await MediaLibrary.getPermissionsAsync();
      
      if (currentStatus.status === 'granted') {
        Alert.alert('Already Granted', 'Photo Library permission is already granted');
        return;
      }

      if (currentStatus.canAskAgain === false) {
        Alert.alert(
          'Permission Denied',
          'Photo Library permission has been denied. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open device settings') },
          ]
        );
        return;
      }

      const result = await MediaLibrary.requestPermissionsAsync();
      console.log('PermissionsSettings: Photo Library permission result:', result.status);
      
      setPermissions(prev => ({ ...prev, photoLibrary: result.status }));

      if (result.status === 'granted') {
        Alert.alert('Success', 'Photo Library permission granted');
      } else {
        Alert.alert('Denied', 'Photo Library permission was denied');
      }
    } catch (error) {
      console.error('PermissionsSettings: Error requesting photo library permission:', error);
      Alert.alert('Error', 'Failed to request photo library permission');
    }
  };

  const requestContactsPermission = async () => {
    console.log('PermissionsSettings: User tapped Contacts permission');
    try {
      const currentStatus = await Contacts.getPermissionsAsync();
      
      if (currentStatus.status === 'granted') {
        Alert.alert('Already Granted', 'Contacts permission is already granted');
        return;
      }

      if (currentStatus.canAskAgain === false) {
        Alert.alert(
          'Permission Denied',
          'Contacts permission has been denied. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open device settings') },
          ]
        );
        return;
      }

      const result = await Contacts.requestPermissionsAsync();
      console.log('PermissionsSettings: Contacts permission result:', result.status);
      
      setPermissions(prev => ({ ...prev, contacts: result.status }));

      if (result.status === 'granted') {
        Alert.alert('Success', 'Contacts permission granted');
      } else {
        Alert.alert('Denied', 'Contacts permission was denied');
      }
    } catch (error) {
      console.error('PermissionsSettings: Error requesting contacts permission:', error);
      Alert.alert('Error', 'Failed to request contacts permission');
    }
  };

  const requestLocationPermission = async () => {
    console.log('PermissionsSettings: User tapped Location permission');
    try {
      const currentStatus = await Location.getForegroundPermissionsAsync();
      
      if (currentStatus.status === 'granted') {
        Alert.alert('Already Granted', 'Location permission is already granted');
        return;
      }

      if (currentStatus.canAskAgain === false) {
        Alert.alert(
          'Permission Denied',
          'Location permission has been denied. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open device settings') },
          ]
        );
        return;
      }

      const result = await Location.requestForegroundPermissionsAsync();
      console.log('PermissionsSettings: Location permission result:', result.status);
      
      setPermissions(prev => ({ ...prev, location: result.status }));

      if (result.status === 'granted') {
        Alert.alert('Success', 'Location permission granted');
      } else {
        Alert.alert('Denied', 'Location permission was denied');
      }
    } catch (error) {
      console.error('PermissionsSettings: Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const requestNotificationsPermission = async () => {
    console.log('PermissionsSettings: User tapped Notifications permission');
    try {
      const currentStatus = await Notifications.getPermissionsAsync();
      
      if (currentStatus.status === 'granted') {
        Alert.alert('Already Granted', 'Notifications permission is already granted');
        return;
      }

      if (currentStatus.canAskAgain === false) {
        Alert.alert(
          'Permission Denied',
          'Notifications permission has been denied. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open device settings') },
          ]
        );
        return;
      }

      const result = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      console.log('PermissionsSettings: Notifications permission result:', result.status);
      
      setPermissions(prev => ({ ...prev, notifications: result.status }));

      if (result.status === 'granted') {
        Alert.alert('Success', 'Notifications permission granted');
      } else {
        Alert.alert('Denied', 'Notifications permission was denied');
      }
    } catch (error) {
      console.error('PermissionsSettings: Error requesting notifications permission:', error);
      Alert.alert('Error', 'Failed to request notifications permission');
    }
  };

  const getStatusColor = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return colors.primary;
      case 'denied':
        return '#FF3B30';
      case 'undetermined':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'undetermined':
        return 'Not Requested';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return 'check-circle';
      case 'denied':
        return 'cancel';
      case 'undetermined':
        return 'help';
      default:
        return 'help';
    }
  };

  const permissionsTitle = 'Permissions';
  const cameraLabel = 'Camera';
  const cameraDesc = 'Take photos and videos';
  const microphoneLabel = 'Microphone';
  const microphoneDesc = 'Record audio and voice messages';
  const photoLibraryLabel = 'Photo Library';
  const photoLibraryDesc = 'Access and upload photos';
  const contactsLabel = 'Contacts';
  const contactsDesc = 'Find friends from your contacts';
  const locationLabel = 'Location';
  const locationDesc = 'Share your location with friends';
  const notificationsLabel = 'Notifications';
  const notificationsDesc = 'Receive push notifications';

  if (loading) {
    const loadingText = 'Loading permissions...';
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Permissions',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Permissions',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TouchableOpacity style={styles.permissionItem} onPress={requestCameraPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="camera.fill" 
                android_material_icon_name="camera" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{cameraLabel}</Text>
                <Text style={styles.permissionDescription}>{cameraDesc}</Text>
              </View>
            </View>
            <View style={styles.permissionRight}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name={getStatusIcon(permissions.camera)} 
                size={20} 
                color={getStatusColor(permissions.camera)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(permissions.camera) }]}>
                {getStatusText(permissions.camera)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestMicrophonePermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="mic.fill" 
                android_material_icon_name="mic" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{microphoneLabel}</Text>
                <Text style={styles.permissionDescription}>{microphoneDesc}</Text>
              </View>
            </View>
            <View style={styles.permissionRight}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name={getStatusIcon(permissions.microphone)} 
                size={20} 
                color={getStatusColor(permissions.microphone)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(permissions.microphone) }]}>
                {getStatusText(permissions.microphone)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestPhotoLibraryPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="photo" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{photoLibraryLabel}</Text>
                <Text style={styles.permissionDescription}>{photoLibraryDesc}</Text>
              </View>
            </View>
            <View style={styles.permissionRight}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name={getStatusIcon(permissions.photoLibrary)} 
                size={20} 
                color={getStatusColor(permissions.photoLibrary)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(permissions.photoLibrary) }]}>
                {getStatusText(permissions.photoLibrary)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestContactsPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="person.2.fill" 
                android_material_icon_name="contacts" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{contactsLabel}</Text>
                <Text style={styles.permissionDescription}>{contactsDesc}</Text>
              </View>
            </View>
            <View style={styles.permissionRight}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name={getStatusIcon(permissions.contacts)} 
                size={20} 
                color={getStatusColor(permissions.contacts)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(permissions.contacts) }]}>
                {getStatusText(permissions.contacts)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestLocationPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{locationLabel}</Text>
                <Text style={styles.permissionDescription}>{locationDesc}</Text>
              </View>
            </View>
            <View style={styles.permissionRight}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name={getStatusIcon(permissions.location)} 
                size={20} 
                color={getStatusColor(permissions.location)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(permissions.location) }]}>
                {getStatusText(permissions.location)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.permissionItem} onPress={requestNotificationsPermission}>
            <View style={styles.permissionLeft}>
              <IconSymbol 
                ios_icon_name="bell.fill" 
                android_material_icon_name="notifications" 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.permissionContent}>
                <Text style={styles.permissionLabel}>{notificationsLabel}</Text>
                <Text style={styles.permissionDescription}>{notificationsDesc}</Text>
              </View>
            </View>
            <View style={styles.permissionRight}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name={getStatusIcon(permissions.notifications)} 
                size={20} 
                color={getStatusColor(permissions.notifications)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(permissions.notifications) }]}>
                {getStatusText(permissions.notifications)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Tap any permission to request access. If a permission is denied, you may need to enable it manually in your device settings.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  permissionContent: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  permissionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  bottomPadding: {
    height: 40,
  },
});
