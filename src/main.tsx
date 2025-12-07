// Force rebuild test: 2025-12-07T19:15:00Z
import React from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <div style={{padding: '40px', textAlign: 'center'}}>
    <h1 style={{fontSize: '32px', color: '#22c55e', marginBottom: '16px'}}>
      ✓ Application loaded successfully!
    </h1>
    <p style={{fontSize: '18px', color: '#666'}}>
      Build system is working. Ready to restore full application.
    </p>
  </div>
);
