// [M4] Browse — lướt danh sách experience, phân trang
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';  
import { listExperiences } from '../../services/experienceService';
import ExperienceCard from '../../components/experience/ExperienceCard';
import { spacing, typography, colors } from '../../utils/theme';

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
    // focus fire cả lần mount đầu + mỗi lần quay lại (vd: sau khi tạo/sửa/xóa experience)
    const unsub = navigation.addListener('focus', loadFirst);
    return unsub;
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>        
      <Text style={styles.heading}>Khám phá 🧭</Text>            
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
      {/* [M4] Tạo experience mới */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.background}
        onPress={() => navigation.navigate('ExperienceForm')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },        // ← MỚI
  heading: { ...typography.title, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }, // ← MỚI
  list: { padding: spacing.md, paddingTop: 0 },
  empty: { alignItems: 'center', marginTop: spacing.xl * 2 },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});