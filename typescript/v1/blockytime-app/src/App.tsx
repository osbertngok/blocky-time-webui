import React from 'react';
import { MainUI } from './components/MainUI';
import { ServiceProvider } from './contexts/ServiceContext';
import './App.css';

function App() {
  return (
    <ServiceProvider>
      <div className="App">
        <header className="App-header">
          <h1>BlockyTime</h1>
        </header>
        <main>
          <MainUI />
        </main>
      </div>
    </ServiceProvider>
  );
}

export default App;
