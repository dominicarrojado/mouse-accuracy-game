import { isLocalhost } from '../serviceWorker';

export function trackEvent(data) {
  if (isLocalhost) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}
