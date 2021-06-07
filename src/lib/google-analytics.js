import { isLocalhost } from '../serviceWorker';

export function trackEventOnGA(data) {
  if (isLocalhost) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: data.event,
    gameDifficulty: data.gameDifficulty,
    gameScore: data.gameScore,
  });
}
