// src/App.tsx
import React from "react";
import AuthGate from "./Auth";
import MainApp from "./app/MainApp";

export default function App() {
  return (
    <AuthGate>
      <MainApp />
    </AuthGate>
  );
}