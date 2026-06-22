import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import * as Location from 'expo-location';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRoute, haversineKm } from '../../api/maps';
import { listExperiences } from '../../services/experienceService';
import { DEFAULT_MAP_REGION } from '../../utils/constants';
import { colors, spacing, typography } from '../../utils/theme';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Tat ca' },
  { key: 'cafe', label: 'cafe' },
  { key: 'workshop', label: 'workshop' },
  { key: 'food', label: 'food' },
  { key: 'entertainment', label: 'entertainment' },
];

const DISTANCE_FILTERS = [
  { key: 'all', label: 'Tat ca', value: null },
  { key: '1', label: '1 km', value: 1 },
  { key: '3', label: '3 km', value: 3 },
  { key: '5', label: '5 km', value: 5 },
  { key: '10', label: '10 km', value: 10 },
];

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

function getFallbackPolyline(points) {
  return points.map((point) => ({
    latitude: point.lat,
    longitude: point.lng,
  }));
}

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [region, setRegion] = useState(DEFAULT_MAP_REGION);
  const [markers, setMarkers] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapMode, setMapMode] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState('all');
  const [activeFilter, setActiveFilter] = useState(null);

  const itineraryItems = route?.params?.itinerary;
  const routeMode = route?.params?.viewMode ?? 'all';
  const itineraryKey = route?.params?.itineraryKey ?? 0;
  const refreshKey = route?.params?.refreshKey ?? 0;
  const itineraryRouteKey = useMemo(
    () =>
      Array.isArray(itineraryItems)
        ? itineraryItems
            .filter(hasValidLocation)
            .map((item) => `${item.id}:${item.location.lat},${item.location.lng}`)
            .join('|')
        : '',
    [itineraryItems],
  );
  const isItineraryMode = useMemo(() => mapMode === 'itinerary', [mapMode]);
  const selectedDistanceValue = useMemo(
    () => DISTANCE_FILTERS.find((item) => item.key === selectedDistance)?.value ?? null,
    [selectedDistance],
  );
  const selectedCategoryLabel = useMemo(
    () => CATEGORY_FILTERS.find((item) => item.key === selectedCategory)?.label ?? 'Tat ca',
    [selectedCategory],
  );
  const selectedDistanceLabel = useMemo(
    () => DISTANCE_FILTERS.find((item) => item.key === selectedDistance)?.label ?? 'Tat ca',
    [selectedDistance],
  );
  const activeFilterOptions = useMemo(
    () => (activeFilter === 'category' ? CATEGORY_FILTERS : DISTANCE_FILTERS),
    [activeFilter],
  );
  const shouldWarnDistanceFilter = useMemo(
    () => !isItineraryMode && selectedDistanceValue !== null && !userCoords,
    [isItineraryMode, selectedDistanceValue, userCoords],
  );
  const displayedMarkers = useMemo(() => {
    if (isItineraryMode) return markers;

    return markers.filter((experience) => {
      const matchesCategory = selectedCategory === 'all' || experience.category === selectedCategory;
      if (!matchesCategory) return false;

      if (selectedDistanceValue === null || !userCoords) return true;

      const distance = haversineKm(
        { lat: userCoords.latitude, lng: userCoords.longitude },
        { lat: experience.location.lat, lng: experience.location.lng },
      );

      return distance <= selectedDistanceValue;
    });
  }, [isItineraryMode, markers, selectedCategory, selectedDistanceValue, userCoords]);

  const resolveBaseRegion = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setPermissionDenied(true);
        setUserCoords(null);
        return DEFAULT_MAP_REGION;
      }

      setPermissionDenied(false);

      try {
        const current = await Location.getCurrentPositionAsync({});
        setUserCoords({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        return {
          ...DEFAULT_MAP_REGION,
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
      } catch {
        setUserCoords(null);
        return DEFAULT_MAP_REGION;
      }
    } catch {
      setPermissionDenied(true);
      setUserCoords(null);
      return DEFAULT_MAP_REGION;
    }
  }, []);

  const loadAllExperiences = useCallback(async () => {
    setLoading(true);
    setError('');
    setMapMode('all');
    setRouteCoordinates([]);
    setRouteError('');
    setRouteLoading(false);
    setSelectedCategory('all');
    setSelectedDistance('all');

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
      setRouteError('');
      setSelectedCategory('all');
      setSelectedDistance('all');

      try {
        const baseRegion = await resolveBaseRegion();
        const validMarkers = Array.isArray(items) ? items.filter(hasValidLocation) : [];
        setMarkers(validMarkers);
        setRegion(getRegionForItems(validMarkers, baseRegion));
        setRouteCoordinates([]);
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

  useEffect(() => {
    if (routeMode !== 'itinerary') {
      setRouteCoordinates([]);
      setRouteError('');
      setRouteLoading(false);
      return;
    }

    const points = Array.isArray(itineraryItems)
      ? itineraryItems
          .filter(hasValidLocation)
          .map((item) => ({ lat: item.location.lat, lng: item.location.lng }))
      : [];

    console.log('[MapScreen] points:', points);

    if (points.length < 2) {
      setRouteCoordinates([]);
      setRouteError('');
      setRouteLoading(false);
      return;
    }

    let active = true;

    const fetchPolyline = async () => {
      setRouteLoading(true);
      setRouteError('');

      try {
        const routeData = await getRoute(points);
        const encoded = routeData.routes?.[0]?.overview_polyline?.points;
        if (!encoded) {
          throw new Error('Missing overview polyline');
        }

        const decoded = polyline.decode(encoded).map(([latitude, longitude]) => ({
          latitude,
          longitude,
        }));

        if (active) {
          setRouteCoordinates(decoded);
        }
      } catch {
        if (active) {
          const fallbackCoordinates = getFallbackPolyline(points);
          setRouteCoordinates(fallbackCoordinates);
          setRouteError('Dang hien thi duong noi tam thoi.');
        }
      } finally {
        if (active) {
          setRouteLoading(false);
        }
      }
    };

    fetchPolyline();

    return () => {
      active = false;
    };
  }, [itineraryItems, itineraryRouteKey, routeMode]);

  useEffect(() => {
    console.log('[MapScreen] routeCoordinates:', routeCoordinates);
  }, [routeCoordinates]);

  useEffect(() => {
    if (!mapRef.current || routeCoordinates.length < 2) return;

    mapRef.current.fitToCoordinates(routeCoordinates, {
      edgePadding: {
        top: 80,
        right: 80,
        bottom: 80,
        left: 80,
      },
      animated: true,
    });
  }, [routeCoordinates]);

  useEffect(() => {
    if (isItineraryMode || !mapRef.current || displayedMarkers.length === 0) return;

    const coordinates = displayedMarkers.map((experience) => ({
      latitude: experience.location.lat,
      longitude: experience.location.lng,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 180,
        right: 80,
        bottom: 80,
        left: 80,
      },
      animated: true,
    });
  }, [displayedMarkers, isItineraryMode]);

  const openAllMap = () => {
    navigation.navigate('Map', {
      viewMode: 'all',
      refreshKey: Date.now(),
    });
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedDistance('all');
  };

  const closeFilterModal = () => {
    setActiveFilter(null);
  };

  const applyFilterOption = (key) => {
    if (activeFilter === 'category') {
      setSelectedCategory(key);
    }

    if (activeFilter === 'distance') {
      setSelectedDistance(key);
    }

    closeFilterModal();
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

      {shouldWarnDistanceFilter ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Can quyen vi tri de loc theo khoang cach.</Text>
        </View>
      ) : null}

      {isItineraryMode && routeLoading ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Dang tai duong di goi y...</Text>
        </View>
      ) : null}

      {isItineraryMode && routeError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{routeError}</Text>
        </View>
      ) : null}

      {!isItineraryMode && markers.length > 0 && displayedMarkers.length === 0 ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Khong co dia diem nao phu hop voi bo loc hien tai.</Text>
        </View>
      ) : null}

      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} region={region} showsUserLocation={!permissionDenied}>
          {routeCoordinates.length >= 2 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={8}
              strokeColor="#0000FF"
              geodesic
              zIndex={999}
            />
          ) : null}

          {displayedMarkers.map((experience) => (
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

        {!isItineraryMode ? (
          <View style={[styles.filterOverlay, { top: insets.top + spacing.sm }]}>
            <View style={styles.filterBox}>
              <Pressable style={styles.selectField} onPress={() => setActiveFilter('category')}>
                <Text style={styles.selectLabel}>Loai dia diem</Text>
                <Text style={styles.selectValue}>{selectedCategoryLabel}</Text>
              </Pressable>

              <Pressable style={styles.selectField} onPress={() => setActiveFilter('distance')}>
                <Text style={styles.selectLabel}>Khoang cach</Text>
                <Text style={styles.selectValue}>{selectedDistanceLabel}</Text>
              </Pressable>

              <Button mode="text" compact onPress={resetFilters} style={styles.resetButton}>
                Dat lai
              </Button>
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={!!activeFilter} transparent animationType="fade" onRequestClose={closeFilterModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeFilterModal} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>
            {activeFilter === 'category' ? 'Chon loai dia diem' : 'Chon khoang cach'}
          </Text>
          {activeFilterOptions.map((item) => (
            <Pressable
              key={item.key}
              style={styles.modalOption}
              onPress={() => applyFilterOption(item.key)}
            >
              <Text style={styles.modalOptionText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapContainer: { flex: 1 },
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
  filterOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  filterBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  selectField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  selectLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  selectValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  resetButton: {
    alignSelf: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '28%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    ...typography.body,
    color: colors.text,
  },
});
