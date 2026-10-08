import { useCallback, useEffect, useRef, useState } from 'react';
export default function useChallengeLocation() {
  const [location, setLocation] = useState(null),
    [loading, setLoading] = useState(false),
    [notice, setNotice] = useState(null);
  const [accuracy, setAccuracy] = useState(null),
    [updatedAt, setUpdatedAt] = useState(null);
  const pending = useRef(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const requestLocation = useCallback(() => {
    if (pending.current) return pending.current;
    setLoading(true);
    setNotice(null);
    const promise = new Promise((resolve, reject) => {
      const fail = error => {
        const message = Number(error?.code) === 1 ? 'Standortzugriff ist blockiert. Erlaube ihn im Browser und versuche es erneut.' : 'Dein Standort konnte nicht bestimmt werden. Bitte versuche es erneut.';
        if (mounted.current) setNotice({
          type: 'error',
          message
        });
        reject(new Error(message));
      };
      if (!navigator.geolocation) {
        fail();
        return;
      }
      navigator.geolocation.getCurrentPosition(position => {
        const next = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        if (mounted.current) {
          setLocation(next);
          setAccuracy(position.coords.accuracy);
          setUpdatedAt(Date.now());
        }
        resolve(next);
      }, fail, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });
    }).finally(() => {
      pending.current = null;
      if (mounted.current) setLoading(false);
    });
    pending.current = promise;
    return promise;
  }, []);
  return {
    location,
    loading,
    notice,
    accuracy,
    updatedAt,
    requestLocation
  };
}
