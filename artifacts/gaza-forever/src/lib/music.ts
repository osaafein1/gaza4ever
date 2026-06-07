// Background music via local audio file
let audio: HTMLAudioElement | null = null;
let active = false;

export function startMusic(): void {
  if (active) return;
  active = true;

  if (!audio) {
    audio = new Audio("/music.m4a");
    audio.loop = true;
    audio.volume = 0.7;
  }

  audio.play().catch(() => {
    // Autoplay blocked — will retry on next user gesture
  });
}

export function stopMusic(): void {
  if (!active) return;
  active = false;
  if (audio) {
    audio.pause();
  }
}
