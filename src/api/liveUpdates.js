import { auth } from '../firebase';

const RETRY_MS = 4000;

export function subscribeToUpdates(date, onEvent) {
  let controller = null;
  let retryTimer = null;
  let stopped = false;

  const connect = async () => {
    if (stopped) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const token = await user.getIdToken();

      controller = new AbortController();
      const res = await fetch(`/api/events?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Stream failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';

        for (const frame of frames) {
          const line = frame.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          try {
            onEvent(JSON.parse(line.slice(5).trim()));
          } catch {
            onEvent({ type: 'unknown' });
          }
        }
      }
    } catch (err) {
      if (stopped || err.name === 'AbortError') return;
    }

    if (!stopped) {
      retryTimer = setTimeout(connect, RETRY_MS);
    }
  };

  connect();

  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    controller?.abort();
  };
}
