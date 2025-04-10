import { useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { MainUI } from './components/MainUI';
import { Statistics } from './components/Statistics';
import { Trends } from './components/Trends';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import { ServiceProvider } from './contexts/ServiceContext';
import './App.css';
import { Link, BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  const mainUIRef = useRef<{ scrollToCurrentTime: () => void }>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleHeaderDoubleClick = () => {
    if (mainUIRef.current) {
      mainUIRef.current.scrollToCurrentTime();
    } else {
      console.error('MainUI ref is not found');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <BrowserRouter>
      <Provider store={store}>
        <ServiceProvider>
          <div className="App">
            <header className="App-header">
              <IconButton 
                onClick={toggleSidebar}
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <h1 onDoubleClick={handleHeaderDoubleClick}>BlockyTime</h1>
            </header>
            <Drawer
              anchor="left"
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            >
              <div className="sidebar-content">
                <ul>
                  <li>
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <Link to="/statistics">Statistics</Link>
                  </li>
                  <li>
                    <Link to="/trends">Trends</Link>
                  </li>
                </ul>
              </div>
            </Drawer>
            <main>
              <Routes>
                <Route path="/" element={<MainUI ref={mainUIRef} />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/trends" element={<Trends />} />
              </Routes>
            </main>
          </div>
        </ServiceProvider>
      </Provider>
    </BrowserRouter>
  );
}

export default App;
