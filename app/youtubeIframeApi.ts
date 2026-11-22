export const YOUTUBE_IFRAME_API = "https://www.youtube.com/iframe_api";

export type YouTubePlayer = {
  loadVideoById(videoId: string): void;
  getCurrentTime(): number;
  destroy(): void;
};

type YouTubePlayerConstructor = new (
  elementId: string,
  options: {
    height: string;
    width: string;
    videoId: string;
    playerVars: { enablejsapi: number; rel: number };
    events: {
      onStateChange: (event: { data: number }) => void;
      onError: () => void;
    };
  },
) => YouTubePlayer;

export type YouTubeNamespace = {
  Player: YouTubePlayerConstructor;
  PlayerState: { ENDED: number };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

export function loadYoutubeApi(): Promise<YouTubeNamespace> {
  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) {
        resolve(window.YT);
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${YOUTUBE_IFRAME_API}"]`,
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src = YOUTUBE_IFRAME_API;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}