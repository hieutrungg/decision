import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listExperiences } from '../../services/experienceService';
import { DEFAULT_MAP_REGION } from '../../utils/constants';
import { colors, spacing, typography } from '../../utils/theme';

function hasValidLocation(experience) {
  const lat = experience?.location?.lat;
  const lng = experience?.location?.lng;
  const address = experience?.location?.address;

  return Number.isFinite(lat) && Number.isFinite(lng) && typeof address === 'string' && address.trim().length > 0;
}

export default function MapScreen({ navigation }) {
  const [region, setRegion] = useState(DEFAULT_MAP_REGION);
  const [markers, setMarkers] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExperiences = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [permissionResult, experienceResult] = await Promise.allSettled([
        Location.requestForegroundPermissionsAsync(),
        listExperiences({}, 50),
      ]);

      if (permissionResult.status === 'fulfilled' && permissionResult.value.status === 'granted') {
        try {
          const current = await Location.getCurrentPositionAsync({});
          setRegion({
            ...DEFAULT_MAP_REGION,
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
          setPermissionDenied(false);
        } catch {
          setRegion(DEFAULT_MAP_REGION);
          setPermissionDenied(false);
        }
      } else {
        setPermissionDenied(true);
        setRegion(DEFAULT_MAP_REGION);
      }

      if (experienceResult.status !== 'fulfilled') {
        throw experienceResult.reason;
      }

      setMarkers(experienceResult.value.items.filter(hasValidLocation));
    } catch (e) {
      setMarkers([]);
      setError(e?.message || 'Khong tai duoc du lieu dia diem luc nay.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>Dang tai ban do va dia diem...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.stateTitle}>Chua tai duoc ban do</Text>
        <Text style={styles.message}>Da xay ra loi khi lay du lieu experience. Vui long thu lai.</Text>
        <Button mode="contained" onPress={loadExperiences}>
          Tai lai
        </Button>
      </SafeAreaView>
    );
  }

  if (!markers.length) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.stateTitle}>Chua co dia diem de hien thi</Text>
        <Text style={styles.message}>
          Hien chua co experience nao co location hop le. Hay seed du lieu roi mo lai man hinh nay.
        </Text>
        <Button mode="outlined" onPress={loadExperiences}>
          Tai lai
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {permissionDenied ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Khong co quyen vi tri, dang hien thi khu vuc Ha Noi mac dinh.</Text>
        </View>
      ) : null}

      <MapView style={styles.map} region={region} showsUserLocation={!permissionDenied}>
        {markers.map((experience) => (
          <Marker
            key={experience.id}
            coordinate={{
              latitude: experience.location.lat,
              longitude: experience.location.lng,
            }}
            title={experience.title}
            description={experience.location.address}
            onPress={() => navigation.navigate('ExperienceDetail', { id: experience.id })}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  stateTitle: {
    ...typography.subtitle,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  banner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  bannerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
