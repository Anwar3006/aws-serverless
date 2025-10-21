// App.js

import { useAuth } from "react-oidc-context";
import Home from "./Home";

function App() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "117eeu1komi6jq014r55pv65vm";
    const logoutUri = "https://d22ps7hs0x7by9.cloudfront.net";
    const cognitoDomain =
      "https://us-east-1zpgytvros.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
      logoutUri
    )}`;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <button onClick={() => auth.removeUser()}>Sign out</button>
        <Home />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => auth.signinRedirect()}>Sign in</button>
      <button onClick={() => signOutRedirect()}>Sign out</button>
    </div>
  );
}

export default App;
