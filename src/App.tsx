import MainApp from "./app/MainApp";
import AuthGate from "./Auth";

export default function App() {
  return (
    <AuthGate>
      <MainApp />
    </AuthGate>
  );
}


