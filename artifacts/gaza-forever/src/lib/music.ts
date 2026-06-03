// Background music via YouTube IFrame Player API
// Video: https://www.youtube.com/watch?v=j-yotRDDySc
// Same public API: startMusic() / stopMusic()

const VIDEO_ID = "j-yotRDDySc";
const CONTAINER_ID = "yt-music-container";

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(v: number): void;
  destroy(): void;
};

let player: YTPlayer | null = null;
let active = false;
let apiLoaded = false;
let pendingStart = false;

function loadYTApi(): void {
  if (document.getElementById("yt-iframe-api-script")) return;
  const tag = document.createElement("script");
  tag.id = "yt-iframe-api-script";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

function createContainer(): HTMLDivElement {
  let el = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    el.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0;z-index:-999;overflow:hidden;";
    document.body.appendChild(el);
  }
  return el;
}

function createPlayer(): void {
  if (player) {
    try { player.playVideo(); } catch {}
    return;
  }
  const container = createContainer();
  const inner = document.createElement("div");
  inner.id = "yt-music-iframe";
  container.appendChild(inner);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const YT = (window as any).YT;
  player = new YT.Player("yt-music-iframe", {
    videoId: VIDEO_ID,
    playerVars: {
      autoplay: 1,
      loop: 1,
      playlist: VIDEO_ID,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
    },
    events: {
      onReady: (e: { target: YTPlayer }) => {
        e.target.setVolume(70);
        if (active) e.target.playVideo();
      },
      onStateChange: (e: { data: number; target: YTPlayer }) => {
        if (e.data === 0 && active) e.target.playVideo();
      },
    },
  }) as YTPlayer;
}

// YouTube calls this globally when the API script finishes loading
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).onYouTubeIframeAPIReady = function () {
  apiLoaded = true;
  if (pendingStart) {
    pendingStart = false;
    createPlayer();
  }
};

export function startMusic(): void {
  if (active) return;
  active = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).YT?.Player) {
    apiLoaded = true;
  }

  loadYTApi();

  if (apiLoaded) {
    createPlayer();
  } else {
    pendingStart = true;
  }
}

export function stopMusic(): void {
  if (!active) return;
  active = false;
  try { player?.pauseVideo(); } catch {}
}
