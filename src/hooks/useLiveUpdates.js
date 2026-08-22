import { useEffect, useRef, useState } from 'react';
import { subscribeToUpdates } from '../api/liveUpdates';

export default function useLiveUpdates(date, onChange) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    if (!date) return undefined;

    const unsubscribe = subscribeToUpdates(date, (event) => {
      if (event.type === 'connected') {
        setConnected(true);
        return;
      }
      if (event.type === 'appointments' || event.type === 'waitlist') {
        handlerRef.current?.(event);
      }
    });

    return () => {
      setConnected(false);
      unsubscribe();
    };
  }, [date]);

  return connected;
}
