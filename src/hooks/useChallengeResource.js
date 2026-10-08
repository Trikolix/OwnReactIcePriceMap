import { useCallback, useEffect, useRef, useState } from 'react';
import { readChallengeResponse } from '../utils/challengePlanning.mjs';
export default function useChallengeResource(url, normalize, emptyValue) {
  const [data, setData] = useState(emptyValue),
    [loading, setLoading] = useState(Boolean(url)),
    [error, setError] = useState(null);
  const request = useRef(null),
    sequence = useRef(0);
  const reload = useCallback(async ({
    silent = false
  } = {}) => {
    const version = ++sequence.current;
    request.current?.abort();
    if (!url) {
      setData(emptyValue);
      setLoading(false);
      setError(null);
      return null;
    }
    const controller = new AbortController();
    request.current = controller;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = normalize(await readChallengeResponse(await fetch(url, {
        signal: controller.signal
      })));
      if (version === sequence.current) setData(result);
      return result;
    } catch (failure) {
      if (failure.name !== 'AbortError' && version === sequence.current) setError(failure.message);
      return null;
    } finally {
      if (version === sequence.current) setLoading(false);
    }
  }, [url, normalize, emptyValue]);
  useEffect(() => {
    reload();
    return () => {
      ++sequence.current;
      request.current?.abort();
    };
  }, [reload]);
  useEffect(() => {
    if (!url) return undefined;
    const onReturn = () => {
      if (document.visibilityState === 'visible') reload({
        silent: true
      });
    };
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    return () => {
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, [url, reload]);
  const updateData = useCallback(update => {
    // A response started before a successful write must not erase that write locally.
    ++sequence.current;
    request.current?.abort();
    setLoading(false);
    setData(update);
  }, []);
  return {
    data,
    loading,
    error,
    reload,
    setData: updateData
  };
}
