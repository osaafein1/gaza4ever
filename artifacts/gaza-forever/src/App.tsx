import { Switch, Route, Router as WouterRouter } from "wouter";
import { useState, useCallback } from "react";
import MenuPage from "./pages/MenuPage";
import GamePage from "./pages/GamePage";
import IntroPage from "./pages/IntroPage";

function MusicPlayer({ playing }: { playing: boolean }) {
  if (!playing) return null;
  return (
    <iframe
      title="background-music"
      width="0"
      height="0"
      src="https://www.youtube.com/embed/ypaKsrujm3E?autoplay=1&loop=1&playlist=ypaKsrujm3E&controls=0&mute=0"
      allow="autoplay"
      style={{ position: "fixed", top: -9999, left: -9999, opacity: 0, pointerEvents: "none" }}
    />
  );
}

function Router({ onMusicStart }: { onMusicStart: () => void }) {
  return (
    <Switch>
      <Route path="/intro">
        {() => <IntroPage onMusicStart={onMusicStart} />}
      </Route>
      <Route path="/">
        {() => <MenuPage onMusicStart={onMusicStart} />}
      </Route>
      <Route path="/game">
        {() => <GamePage onMusicStart={onMusicStart} />}
      </Route>
      <Route>
        {() => <IntroPage onMusicStart={onMusicStart} />}
      </Route>
    </Switch>
  );
}

export default function App() {
  const [musicPlaying, setMusicPlaying] = useState(false);

  const handleMusicStart = useCallback(() => {
    setMusicPlaying(true);
  }, []);

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <MusicPlayer playing={musicPlaying} />
      <Router onMusicStart={handleMusicStart} />
    </WouterRouter>
  );
}
