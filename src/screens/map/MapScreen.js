import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  { key: 'all', label: 'Tất cả' },
  { key: 'cafe', label: 'Cà phê' },
  { key: 'workshop', label: 'Lớp trải nghiệm' },
  { key: 'food', label: 'Ẩm thực' },
  { key: 'entertainment', label: 'Giải trí' },
];

const DISTANCE_FILTERS = [
  { key: 'all', label: 'Tất cả', value: null },
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

function getRouteSummary(routeData, points) {
  const legs = routeData?.routes?.[0]?.legs ?? [];
  const distanceMeters = legs.reduce((sum, leg) => sum + (leg?.distance?.value ?? 0), 0);
  const durationSeconds = legs.reduce((sum, leg) => sum + (leg?.duration?.value ?? 0), 0);

  if (distanceMeters > 0 || durationSeconds > 0) {
    return {
      distanceKm: distanceMeters / 1000,
      durationMin: durationSeconds / 60,
      legs: legs.length,
    };
  }

  if (points.length >= 2) {
    const distanceKm = points.slice(1).reduce((sum, point, index) => {
      return sum + haversineKm(points[index], point);
    }, 0);

    return {
      distanceKm,
      durationMin: 0,
      legs: Math.max(points.length - 1, 0),
    };
  }

  return { distanceKm: 0, durationMin: 0, legs: 0 };
}

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [region, setRegion] = useState(DEFAULT_MAP_REGION);
  const [markers, setMarkers] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeSummary, setRouteSummary] = useState({ distanceKm: 0, durationMin: 0, legs: 0 });
  const [selectedRouteIds, setSelectedRouteIds] = useState([]);
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
  const isItineraryMode = useMemo(() => mapMode === 'itinerary', [mapMode]);
  const selectedRoutePoints = useMemo(
    () =>
      selectedRouteIds
        .map((id) => markers.find((item) => item.id === id))
        .filter(Boolean),
    [markers, selectedRouteIds],
  );
  const selectedDistanceValue = useMemo(
    () => DISTANCE_FILTERS.find((item) => item.key === selectedDistance)?.value ?? null,
    [selectedDistance],
  );
  const selectedCategoryLabel = useMemo(
    () => CATEGORY_FILTERS.find((item) => item.key === selectedCategory)?.label ?? 'Tất cả',
    [selectedCategory],
  );
  const selectedDistanceLabel = useMemo(
    () => DISTANCE_FILTERS.find((item) => item.key === selectedDistance)?.label ?? 'Tất cả',
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
    setSelectedRouteIds([]);
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
      setError(e?.message || 'Không tải được dữ liệu địa điểm lúc này.');
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
      setSelectedRouteIds([]);
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
        setError(e?.message || 'Không mở được lịch trình trên bản đồ.');
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
    if (routeMode === 'itinerary') return;

    setRouteCoordinates([]);
    setRouteError('');
    setRouteLoading(false);
    setSelectedRouteIds([]);
  }, [routeMode]);

  useEffect(() => {
    if (routeMode !== 'itinerary') return;

    if (selectedRoutePoints.length !== 2) {
      setRouteCoordinates([]);
      setRouteSummary({ distanceKm: 0, durationMin: 0, legs: 0 });
      setRouteError('');
      setRouteLoading(false);
      return;
    }

    let active = true;

    const fetchPolyline = async () => {
      setRouteLoading(true);
      setRouteError('');

      try {
        const points = selectedRoutePoints.map((item) => ({ lat: item.location.lat, lng: item.location.lng }));
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
          setRouteSummary(getRouteSummary(routeData, points));
        }
      } catch {
        if (active) {
          const points = selectedRoutePoints.map((item) => ({ lat: item.location.lat, lng: item.location.lng }));
          const fallbackCoordinates = getFallbackPolyline(points);
          setRouteCoordinates(fallbackCoordinates);
          setRouteSummary(getRouteSummary(null, points));
          setRouteError('Đang hiển thị đường đi tạm thời.');
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
  }, [routeMode, selectedRoutePoints]);

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

  const handleMarkerPress = (experience) => {
    if (!isItineraryMode) {
      navigation.navigate('ExperienceDetail', { id: experience.id });
      return;
    }

    setRouteError('');
    setSelectedRouteIds((current) => {
      if (current.length === 0) {
        return [experience.id];
      }

      if (current.length === 1) {
        if (current[0] === experience.id) {
          return [];
        }

        return [current[0], experience.id];
      }

      return [experience.id];
    });
  };

  const clearRouteSelection = () => {
    setSelectedRouteIds([]);
    setRouteCoordinates([]);
    setRouteSummary({ distanceKm: 0, durationMin: 0, legs: 0 });
    setRouteError('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>Đang tải bản đồ và địa điểm...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.stateTitle}>Chưa tải được bản đồ</Text>
        <Text style={styles.message}>Đã xảy ra lỗi khi lấy dữ liệu địa điểm. Vui lòng thử lại.</Text>
        <Button mode="contained" onPress={isItineraryMode ? () => loadItinerary(itineraryItems) : loadAllExperiences}>
          Tải lại
        </Button>
      </SafeAreaView>
    );
  }

  if (!markers.length) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.stateTitle}>
          {isItineraryMode ? 'Lịch trình gợi ý chưa có tọa độ hợp lệ' : 'Chưa có địa điểm để hiển thị'}
        </Text>
        <Text style={styles.message}>
          {isItineraryMode
            ? 'Các mục trong lịch trình này chưa có vị trí hợp lệ để đặt dấu trên bản đồ.'
            : 'Hiện chưa có trải nghiệm nào có vị trí hợp lệ. Hãy thêm dữ liệu rồi mở lại màn hình này.'}
        </Text>
        <Button mode="outlined" onPress={isItineraryMode ? openAllMap : loadAllExperiences}>
          {isItineraryMode ? 'Xem bản đồ chung' : 'Tải lại'}
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {permissionDenied ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Không có quyền vị trí, đang hiển thị khu vực Hà Nội mặc định.</Text>
        </View>
      ) : null}

      {shouldWarnDistanceFilter ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Cần quyền vị trí để lọc theo khoảng cách.</Text>
        </View>
      ) : null}

      {isItineraryMode && routeLoading ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Đang tải đường đi gợi ý...</Text>
        </View>
      ) : null}

      {isItineraryMode && routeError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{routeError}</Text>
        </View>
      ) : null}

      {!isItineraryMode && markers.length > 0 && displayedMarkers.length === 0 ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Không có địa điểm nào phù hợp với bộ lọc hiện tại.</Text>
        </View>
      ) : null}

      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} region={region} showsUserLocation={!permissionDenied}>
          {routeCoordinates.length >= 2 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={8}
              strokeColor="#0000FF"
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
              pinColor={
                selectedRouteIds[0] === experience.id
                  ? colors.primary
                  : selectedRouteIds[1] === experience.id
                    ? colors.secondary
                    : undefined
              }
              onPress={() => handleMarkerPress(experience)}
            />
          ))}
        </MapView>

        {isItineraryMode ? (
          <View style={[styles.routePicker, { bottom: insets.bottom + 72 }]}>
            <View style={styles.routePickerHeader}>
              <View style={styles.routePickerHeaderText}>
                <Text style={styles.routePickerTitle}>Chọn 2 điểm để xem đường đi</Text>
                <Text style={styles.routePickerHint}>
                  {selectedRoutePoints.length === 0
                    ? 'Chạm vào một địa điểm để chọn điểm đầu.'
                    : selectedRoutePoints.length === 1
                      ? `Đã chọn ${selectedRoutePoints[0]?.title}. Chọn điểm thứ hai.`
                      : `Đang xem ${selectedRoutePoints[0]?.title} → ${selectedRoutePoints[1]?.title}.`}
                </Text>
              </View>
              <Button mode="text" compact onPress={clearRouteSelection}>
                Xóa chọn
              </Button>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routeChipRow}>
              {displayedMarkers.map((experience) => {
                const isFirst = selectedRouteIds[0] === experience.id;
                const isSecond = selectedRouteIds[1] === experience.id;
                return (
                  <Pressable
                    key={experience.id}
                    style={[
                      styles.routeChip,
                      isFirst && styles.routeChipFirst,
                      isSecond && styles.routeChipSecond,
                    ]}
                    onPress={() => handleMarkerPress(experience)}
                  >
                    <Text style={styles.routeChipText}>
                      {isFirst ? 'A: ' : isSecond ? 'B: ' : ''}
                      {experience.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {routeCoordinates.length >= 2 ? (
              <View style={styles.routeResult}>
                <Text style={styles.routeResultText}>
                  Khoảng cách: ~{routeSummary.distanceKm.toFixed(1)} km
                  {routeSummary.durationMin > 0 ? ` · ~${Math.round(routeSummary.durationMin)} phút` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {!isItineraryMode ? (
          <View style={[styles.filterOverlay, { top: insets.top + spacing.sm }]}>
            <View style={styles.filterBox}>
              <Pressable style={styles.selectField} onPress={() => setActiveFilter('category')}>
                <Text style={styles.selectLabel}>Loại địa điểm</Text>
                <Text style={styles.selectValue}>{selectedCategoryLabel}</Text>
              </Pressable>

              <Pressable style={styles.selectField} onPress={() => setActiveFilter('distance')}>
                <Text style={styles.selectLabel}>Khoảng cách</Text>
                <Text style={styles.selectValue}>{selectedDistanceLabel}</Text>
              </Pressable>

              <Button mode="text" compact onPress={resetFilters} style={styles.resetButton}>
                Đặt lại
              </Button>
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={!!activeFilter} transparent animationType="fade" onRequestClose={closeFilterModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeFilterModal} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>
            {activeFilter === 'category' ? 'Chọn loại địa điểm' : 'Chọn khoảng cách'}
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
  routePicker: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 16,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  routePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  routePickerHeaderText: {
    flex: 1,
    gap: 2,
  },
  routePickerTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  routePickerHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  routeChipRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  routeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  routeChipFirst: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1EA',
  },
  routeChipSecond: {
    borderColor: colors.secondary,
    backgroundColor: '#E8FBF8',
  },
  routeChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  routeResult: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routeResultText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
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
