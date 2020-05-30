import { isLocalhost } from '../serviceWorker';

export function trackEventOnGA(data) {
  if (typeof window.gtag !== 'function' || isLocalhost) {
    return;
  }

  window.gtag('event', 'click', {
    event_category: data.category,
    event_label: data.label,
    value: data.value,
  });
}
