// [M3] Map & Location — hiển thị experiences quanh vị trí hiện tại
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Text } from 'react-native-paper';
import { useFirestore } from '../../hooks/useFirestore';
import { COLLECTIONS } from '../../utils/constants';

// Hồ Gươm — fallback khi chưa có quyền vị trí
const HANOI = { latitude: 21.0285, longitude: 105.8542, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function MapScreen() {
  const [region, setRegion] = useState(HANOI);
  const [denied, setDenied] = useState(false);
  const { data: experiences } = useFirestore(COLLECTIONS.EXPERIENCES, [], 50);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setRegion((r) => ({ ...r, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
    })();
  }, []);

  return (
    <View style={styles.container}>
      {denied && <Text style={styles.warn}>Không có quyền vị trí — hiển thị khu vực Hà Nội</Text>}
      <MapView style={styles.map} region={region} showsUserLocation>
        {experiences.map(
          (e) =>
            e.location?.lat && (
              <Marker
                key={e.id}
                coordinate={{ latitude: e.location.lat, longitude: e.location.lng }}
                title={e.title}
                description={`${(e.budget / 1000).toFixed(0)}k · ${e.category}`}
              />
            ),
        )}
      </MapView>
      {/* TODO [M3]: vẽ Polyline route cho mini itinerary (api/maps.js → getRoute) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  warn: { textAlign: 'center', padding: 8 },
});
