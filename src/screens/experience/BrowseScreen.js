// [M4] Browse — lướt danh sách experience, phân trang
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { listExperiences } from '../../services/experienceService';
import ExperienceCard from '../../components/experience/ExperienceCard';
import { spacing } from '../../utils/theme';

export default function BrowseScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFirst = async () => {
    setLoading(true);
    const res = await listExperiences({}, 10);
    setItems(res.items);
    setLastDoc(res.lastDoc);
    setLoading(false);
  };

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    const res = await listExperiences({}, 10, lastDoc);
    setItems((prev) => [...prev, ...res.items]);
    setLastDoc(res.lastDoc);
    setLoadingMore(false);
  };

  useEffect(() => {
    loadFirst();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <ExperienceCard
          experience={item}
          onPress={() => navigation.navigate('ExperienceDetail', { id: item.id })}
        />
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text>Chưa có dữ liệu — hãy seed experiences vào Firestore</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  empty: { alignItems: 'center', marginTop: spacing.xl * 2 },
});
