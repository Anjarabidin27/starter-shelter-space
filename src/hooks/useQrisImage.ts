import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'store-assets';

export function useQrisImage() {
  const { currentStore } = useStore();
  const [qrisUrl, setQrisUrl] = useState<string>('');

  const load = useCallback(async () => {
    if (!currentStore) return;
    const key = `qrisUrl:${currentStore.id}`;
    const local = localStorage.getItem(key);
    if (local) {
      setQrisUrl(local);
      return;
    }

    try {
      // Try to find the latest QRIS image by prefix in storage
      const { data: files, error } = await supabase.storage.from(BUCKET).list('qris', {
        limit: 100,
        sortBy: { column: 'name', order: 'desc' },
      });
      if (error) throw error;

      const candidates = (files || []).filter(f => f.name.includes(`${currentStore.id}-qris-`));
      if (candidates.length > 0) {
        // Pick most recent by name (timestamp at the end of name)
        const latest = candidates.sort((a, b) => (a.name < b.name ? 1 : -1))[0];
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(`qris/${latest.name}`);
        if (data?.publicUrl) {
          setQrisUrl(data.publicUrl);
          localStorage.setItem(key, data.publicUrl);
        }
      }
    } catch (e) {
      console.warn('Failed to load QRIS from storage', e);
    }
  }, [currentStore]);

  useEffect(() => {
    setQrisUrl('');
    load();
  }, [load]);

  return { qrisUrl, refresh: load };
}
