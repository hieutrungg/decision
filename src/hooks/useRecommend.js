// src/hooks/useRecommend.js
// [M2] Hook gọi recommendService, quản lý loading/error/result.
import { useState, useCallback } from 'react';
import * as recommendService from '../services/recommendService';

export function useRecommend() {
  const [pkg, setPkg] = useState(null);
  const [single, setSingle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    setSingle(null);
    try {
      const result = await recommendService.generatePackage(filters);
      setPkg(result);
      return result;
    } catch (e) {
      console.error('generatePackage error:', e);
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const randomOne = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    setPkg(null);
    try {
      const result = await recommendService.getRandomExperience(filters);
      setSingle(result);
      return result;
    } catch (e) {
      console.error('generatePackage error:', e);
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { pkg, single, loading, error, generate, randomOne };
}
