import React from 'react';
import { TimeTable } from './components/TimeTable';
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
          <TimeTable />
        </main>
      </div>
    </ServiceProvider>
  );
}

export default App;
