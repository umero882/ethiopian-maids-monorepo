import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Ethiopian Maids` : 'Ethiopian Maids';
    return () => { document.title = prevTitle; };
  }, [title]);
}
