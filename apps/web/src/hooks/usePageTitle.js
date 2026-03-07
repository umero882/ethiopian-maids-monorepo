import { useEffect } from 'react';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export function usePageTitle(title) {
  const { settings } = useSystemSettings();
  const siteName = settings.platform_name || 'Ethiopian Maids';

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${siteName}` : siteName;
    return () => { document.title = prevTitle; };
  }, [title, siteName]);
}
