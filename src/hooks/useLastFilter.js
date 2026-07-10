import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_FILTER_STORAGE_KEY = '@decision:last-filter';

export function useLastFilter() {
  const [lastFilter, setLastFilterState] = useState(null);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(LAST_FILTER_STORAGE_KEY)
      .then((value) => {
        if (!isMounted || !value) return;

        try {
          setLastFilterState(JSON.parse(value));
        } catch (error) {
          console.warn('Failed to parse last filter', error);
        }
      })
      .catch((error) => {
        console.warn('Failed to load last filter', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveLastFilter = useCallback(async (filter) => {
    setLastFilterState(filter);
    try {
      await AsyncStorage.setItem(LAST_FILTER_STORAGE_KEY, JSON.stringify(filter));
    } catch (error) {
      console.warn('Failed to save last filter', error);
    }
  }, []);

  return { lastFilter, saveLastFilter };
}