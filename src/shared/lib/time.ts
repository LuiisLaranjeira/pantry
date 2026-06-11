import i18n from './i18n';

export function timeAgo(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60_000));
  if (mins < 60) return mins <= 1 ? i18n.t('time.justNow') : i18n.t('time.minsAgo', { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return i18n.t('time.hrsAgo', { n: hrs });
  const days = Math.floor(hrs / 24);
  return days === 1 ? i18n.t('time.yesterday') : i18n.t('time.daysAgo', { n: days });
}
