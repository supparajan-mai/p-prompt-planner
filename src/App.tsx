import AuthGate from "./Auth";
import MainApp from "./app/MainApp";

export default function App() {
  return (
    <AuthGate>
      <MainApp />
    </AuthGate>
  );
}
