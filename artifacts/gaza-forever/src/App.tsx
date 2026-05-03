import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useEffect } from "react";
import MenuPage from "./pages/MenuPage";
import GamePage from "./pages/GamePage";
import IntroPage from "./pages/IntroPage";
import { startMusic, stopMusic } from "./lib/music";

function MusicController() {
  const [location] = useLocation();
  useEffect(() => {
    if (location === "/") {
      stopMusic();
    }
  }, [location]);
  return null;
}

function AppInner() {
  const handleMusicStart = () => startMusic();

  return (
    <>
      <MusicController />
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
