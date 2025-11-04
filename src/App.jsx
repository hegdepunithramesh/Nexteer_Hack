import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpotsProvider } from './context/SpotsContext';
import MapView from './pages/MapView';
import AdminDashboard from './pages/AdminDashboard';
import 'leaflet/dist/leaflet.css';


function App() {
  return (
    <SpotsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </SpotsProvider>
  );
}
export default App;
