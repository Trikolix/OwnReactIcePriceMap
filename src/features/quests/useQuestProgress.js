import { useEffect, useRef, useState } from 'react';
import { questMilestones, questProgressMessage } from './progress.mjs';

export function useQuestProgress(quest, userId, enabled) {
  const [notification, setNotification] = useState(null);
  const [unread, setUnread] = useState(false);
  const seen = useRef(null);
  const scope = `${userId}:${quest?.id || ''}`;
  useEffect(() => { seen.current = null; setNotification(null); setUnread(false); }, [scope]);
  useEffect(() => {
    if (!quest || !userId) return;
    const key = `iceapp:quest-progress:${userId}:${quest.id}`;
    const milestones = questMilestones(quest);
    if (seen.current === null) {
      try {
        const stored = JSON.parse(localStorage.getItem(key));
        seen.current = Array.isArray(stored) ? new Set(stored) : null;
      } catch { seen.current = null; }
    }
    const added = seen.current ? milestones.filter(item => !seen.current.has(item.id)) : [];
    seen.current ||= new Set();
    milestones.forEach(item => seen.current.add(item.id));
    try { localStorage.setItem(key, JSON.stringify([...seen.current])); } catch { /* Session tracking still works. */ }
    if (enabled && added.length) {
      setNotification({ title: quest.title, message: questProgressMessage(added), chapterId: added.at(-1).chapterId });
      setUnread(true);
    } else if (!enabled) { setNotification(null); setUnread(false); }
  }, [quest, userId, enabled]);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 8000);
    return () => clearTimeout(timer);
  }, [notification]);
  return { notification, unread, dismiss: () => setNotification(null), markRead: () => { setUnread(false); setNotification(null); } };
}
