"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SessionApiVideo } from "../src/session/sessionApi";
import {
  WATCH_ON_YOUTUBE_LINK_LABEL,
  buildWatchOnYoutubeUrl,
  completedWatchSeconds,
  formatDurationClock,
  sessionTotalSeconds,
  upNextVideos,
  watchedCounterLabel,
} from "../src/session/sessionPlayer";
import { loadYoutubeApi, type YouTubePlayer } from "./youtubeIframeApi";

interface SessionPlayerProps {
  videos: SessionApiVideo[];
}

export function SessionPlayer({ videos }: SessionPlayerProps) {
  const mountId = useId().replace(/:/g, "");
  const playerElementId = `session-player-${mountId}`;
  const playerRef = useRef<YouTubePlayer | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [skippedSeconds, setSkippedSeconds] = useState(0);

  const totalSeconds = sessionTotalSeconds(videos);
  const finished = currentIndex >= videos.length;
  const currentVideo = finished ? null : videos[currentIndex];
  const remaining = upNextVideos(videos, currentIndex);
  const videoIds = videos.map((video) => video.id);

  const goToNext = useCallback(() => {
    setCurrentIndex((index) => Math.min(index + 1, videos.length));
    setCurrentTimeSeconds(0);
  }, [videos.length]);

  const goToNextRef = useRef(goToNext);
  goToNextRef.current = goToNext;

  const skip = useCallback(() => {
    const player = playerRef.current;
    if (player) {
      setSkippedSeconds((total) => total + Math.floor(player.getCurrentTime()));
    }
    goToNext();
  }, [goToNext]);

  useEffect(() => {
    setCurrentIndex(0);
    setCurrentTimeSeconds(0);
    setSkippedSeconds(0);
  }, [videos]);

  useEffect(() => {
    if (videos.length === 0) {
      return;
    }

    let cancelled = false;

    const setup = async () => {
      const YT = await loadYoutubeApi();
      if (cancelled) {
        return;
      }

      playerRef.current?.destroy();
      playerRef.current = null;

      const firstVideo = videos[0];
      if (!firstVideo) {
        return;
      }

      const player = new YT.Player(playerElementId, {
        height: "100%",
        width: "100%",
        videoId: firstVideo.id,
        playerVars: {
          enablejsapi: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              goToNextRef.current();
            }
          },
          onError: () => {
            goToNextRef.current();
          },
        },
      });
      playerRef.current = player;
    };

    void setup();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [playerElementId, videos]);

  useEffect(() => {
    if (finished || !currentVideo || !playerRef.current) {
      return;
    }
    playerRef.current.loadVideoById(currentVideo.id);
    setCurrentTimeSeconds(0);
  }, [currentVideo, finished]);

  useEffect(() => {
    if (finished) {
      return;
    }

    const tick = () => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      setCurrentTimeSeconds(Math.floor(player.getCurrentTime()));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [finished]);

  const watchedSeconds = finished
    ? totalSeconds
    : completedWatchSeconds(videos, currentIndex) +
      currentTimeSeconds +
      skippedSeconds;

  return (
    <section className="session-player" aria-labelledby="session-player-heading">
      <h2 id="session-player-heading">Your session</h2>

      {!finished ? (
        <div className="session-player-frame">
          <div id={playerElementId} />
        </div>
      ) : (
        <p className="session-player-done">Session finished.</p>
      )}

      <p className="session-player-counter" aria-live="polite">
        {watchedCounterLabel(watchedSeconds, totalSeconds)}
      </p>

      <div className="session-player-actions">
        <button type="button" onClick={skip} disabled={finished}>
          Skip
        </button>
        <a
          href={buildWatchOnYoutubeUrl(videoIds)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {WATCH_ON_YOUTUBE_LINK_LABEL}
        </a>
      </div>

      {currentVideo ? (
        <p className="session-player-now-playing">
          Now playing: {currentVideo.title} ({formatDurationClock(currentVideo.length)})
        </p>
      ) : null}

      <h3 className="session-player-up-next-heading">Up next</h3>
      <ol className="session-player-up-next">
        {remaining.map((video) => (
          <li key={video.id}>
            <span className="session-player-up-next-title">{video.title}</span>
            <span className="session-player-up-next-length">
              {formatDurationClock(video.length)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}