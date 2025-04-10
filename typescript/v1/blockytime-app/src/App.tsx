import { useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { MainUI } from './components/MainUI';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import { ServiceProvider } from './contexts/ServiceContext';
import './App.css';

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
              <h2>Settings</h2>
            </div>
          </Drawer>
          <main>
            <MainUI ref={mainUIRef} />
          </main>
        </div>
      </ServiceProvider>
    </Provider>
  );
}

export default App;
