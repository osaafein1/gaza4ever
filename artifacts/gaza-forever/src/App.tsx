import { Switch, Route, Router as WouterRouter } from "wouter";
import MenuPage from "./pages/MenuPage";
import GamePage from "./pages/GamePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MenuPage} />
      <Route path="/game" component={GamePage} />
      <Route component={MenuPage} />
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}
