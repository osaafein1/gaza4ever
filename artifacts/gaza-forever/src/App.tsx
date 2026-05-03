import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
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

function AppInner() {
  const [musicStarted, setMusicStarted] = useState(false);
  const [location] = useLocation();

  const handleMusicStart = useCallback(() => {
    setMusicStarted(true);
  }, []);

  // Music plays only on /intro and /game — stops (iframe removed) on menu
  const musicPlaying = musicStarted && (location === "/intro" || location === "/game");

  return (
    <>
      <MusicPlayer playing={musicPlaying} />
      <Switch>
        <Route path="/intro">
          {() => <IntroPage onMusicStart={handleMusicStart} />}
        </Route>
        <Route path="/">
          {() => {
            const seen = sessionStorage.getItem("gz_intro_seen");
            if (!seen) {
              sessionStorage.setItem("gz_intro_seen", "1");
              return <Redirect to="/intro" />;
            }
            return <MenuPage onMusicStart={handleMusicStart} />;
          }}
        </Route>
        <Route path="/game">
          {() => <GamePage onMusicStart={handleMusicStart} />}
        </Route>
        <Route>
          {() => <IntroPage onMusicStart={handleMusicStart} />}
        </Route>
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppInner />
    </WouterRouter>
  );
}
