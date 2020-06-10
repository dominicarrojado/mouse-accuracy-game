import { isLocalhost } from '../serviceWorker';

export function trackEventOnGA(data) {
  if (typeof window.gtag !== 'function' || isLocalhost) {
    return;
  }

  window.gtag('event', data.action, {
    event_category: 'game',
    event_label: data.label,
    value: data.value,
  });
}
