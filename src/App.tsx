// Minimal test: 2025-12-07T19:25:00Z - Testing react-router-dom only
import { BrowserRouter, Routes, Route } from "react-router-dom";

const TestPage = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1 style={{ fontSize: '32px', color: '#22c55e', marginBottom: '16px' }}>
      ✓ Router Working!
    </h1>
    <p style={{ fontSize: '18px', color: '#666' }}>
      React Router is functional. Testing next layer...
    </p>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="*" element={<div style={{ padding: '40px' }}>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
