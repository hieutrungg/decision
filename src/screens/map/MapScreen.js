import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

function getRegionForItems(items, fallbackRegion = DEFAULT_MAP_REGION) {
  if (!items.length) return fallbackRegion;

  if (items.length === 1) {
    return {
      ...fallbackRegion,
      latitude: items[0].location.lat,
      longitude: items[0].location.lng,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
  }

  const lats = items.map((item) => item.location.lat);
  const lngs = items.map((item) => item.location.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.03),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.03),
  };
}

export default function MapScreen({ navigation, route }) {
  const [region, setRegion] = useState(DEFAULT_MAP_REGION);
  const [markers, setMarkers] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapMode, setMapMode] = useState('all');

  const itineraryItems = route?.params?.itinerary;
  const routeMode = route?.params?.viewMode ?? 'all';
  const itineraryKey = route?.params?.itineraryKey ?? 0;
  const refreshKey = route?.params?.refreshKey ?? 0;

  const isItineraryMode = useMemo(() => mapMode === 'itinerary', [mapMode]);

  const resolveBaseRegion = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setPermissionDenied(true);
        return DEFAULT_MAP_REGION;
      }

      setPermissionDenied(false);

      try {
        const current = await Location.getCurrentPositionAsync({});
        return {
          ...DEFAULT_MAP_REGION,
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
      } catch {
        return DEFAULT_MAP_REGION;
      }
    } catch {
      setPermissionDenied(true);
      return DEFAULT_MAP_REGION;
    }
  }, []);

  const loadAllExperiences = useCallback(async () => {
    setLoading(true);
    setError('');
    setMapMode('all');

    try {
      const [baseRegion, experienceResult] = await Promise.all([
        resolveBaseRegion(),
        listExperiences({}, 50),
      ]);

      const validMarkers = experienceResult.items.filter(hasValidLocation);
      setMarkers(validMarkers);
      setRegion(baseRegion);
    } catch (e) {
      setMarkers([]);
      setError(e?.message || 'Khong tai duoc du lieu dia diem luc nay.');
    } finally {
      setLoading(false);
    }
  }, [resolveBaseRegion]);

  const loadItinerary = useCallback(
    async (items) => {
      setLoading(true);
      setError('');
      setMapMode('itinerary');

      try {
        const baseRegion = await resolveBaseRegion();
        const validMarkers = Array.isArray(items) ? items.filter(hasValidLocation) : [];
        setMarkers(validMarkers);
        setRegion(getRegionForItems(validMarkers, baseRegion));
      } catch (e) {
        setMarkers([]);
        setError(e?.message || 'Khong mo duoc lich trinh tren ban do.');
      } finally {
        setLoading(false);
      }
    },
    [resolveBaseRegion],
  );

  useEffect(() => {
    if (routeMode === 'itinerary') {
      loadItinerary(itineraryItems);
      return;
    }

    loadAllExperiences();
  }, [itineraryItems, itineraryKey, loadAllExperiences, loadItinerary, refreshKey, routeMode]);

  const openAllMap = () => {
    navigation.navigate('Map', {
      viewMode: 'all',
      refreshKey: Date.now(),
    });
  };

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
        <Text style={styles.message}>Da xay ra loi khi lay du lieu dia diem. Vui long thu lai.</Text>
        <Button mode="contained" onPress={isItineraryMode ? () => loadItinerary(itineraryItems) : loadAllExperiences}>
          Tai lai
        </Button>
      </SafeAreaView>
    );
  }

  if (!markers.length) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.stateTitle}>
          {isItineraryMode ? 'Lich trinh goi y chua co toa do hop le' : 'Chua co dia diem de hien thi'}
        </Text>
        <Text style={styles.message}>
          {isItineraryMode
            ? 'Cac item trong lich trinh nay chua co location hop le de dat marker.'
            : 'Hien chua co experience nao co location hop le. Hay seed du lieu roi mo lai man hinh nay.'}
        </Text>
        <Button mode="outlined" onPress={isItineraryMode ? openAllMap : loadAllExperiences}>
          {isItineraryMode ? 'Xem ban do chung' : 'Tai lai'}
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {isItineraryMode ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Dang xem Lich trinh goi y</Text>
        </View>
      ) : null}

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

