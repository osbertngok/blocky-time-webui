import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { MainUI } from './components/MainUI';
import { ServiceProvider } from './contexts/ServiceContext';
import './App.css';

function App() {
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App;
