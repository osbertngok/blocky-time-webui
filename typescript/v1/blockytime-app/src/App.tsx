import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { MainUI } from './components/MainUI';
import { ServiceProvider } from './contexts/ServiceContext';
import './App.css';

function App() {
  const mainUIRef = useRef<{ scrollToCurrentTime: () => void }>(null);

  const handleHeaderDoubleClick = () => {
    if (mainUIRef.current) {
      mainUIRef.current.scrollToCurrentTime();
    } else {
      console.error('MainUI ref is not found');
    }
  };

  return (
    <Provider store={store}>
      <ServiceProvider>
        <div className="App">
          <header className="App-header">
            <h1 onDoubleClick={handleHeaderDoubleClick}>BlockyTime</h1>
          </header>
          <main>
            <MainUI ref={mainUIRef} />
          </main>
        </div>
      </ServiceProvider>
    </Provider>
  );
}

export default App;
