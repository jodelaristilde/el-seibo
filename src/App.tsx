import { useState, useLayoutEffect, useEffect } from 'react';
import './App.css';
import HomeSection from './components/HomeSection';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import ImagesSection from './components/ImagesSection';
import GuestUploadSection from './components/GuestUploadSection';
import SponsorsSection from './components/SponsorsSection';
import DonateSection from './components/DonateSection';
import ContactSection from './components/ContactSection';
import AdminSection from './components/AdminSection';

export interface GuestImage {
  url: string;
  filename: string;
  owner: string;
}

const Logo = () => (
  <svg className="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#2c5aa0" strokeWidth="2"/>
    <rect x="45" y="25" width="10" height="50" fill="#2c5aa0" rx="2"/>
    <rect x="25" y="45" width="50" height="10" fill="#2c5aa0" rx="2"/>
    <path d="M 50 42 C 50 42, 45 35, 40 35 C 35 35, 32 38, 32 42 C 32 48, 50 58, 50 58 C 50 58, 68 48, 68 42 C 68 38, 65 35, 60 35 C 55 35, 50 42, 50 42 Z" fill="#e74c3c" opacity="0.9"/>
    <path d="M 30 70 Q 35 75, 40 70 L 38 68 Q 35 71, 32 68 Z" fill="#f39c12"/>
    <path d="M 60 70 Q 65 75, 70 70 L 68 68 Q 65 71, 62 68 Z" fill="#f39c12"/>
    <rect x="20" y="20" width="3" height="8" fill="#002d62"/>
    <rect x="20" y="28" width="3" height="8" fill="#ce1126"/>
    <path id="curve" d="M 15,50 A 35,35 0 0,1 85,50" fill="none"/>
    <text fontSize="8" fill="#2c5aa0" fontWeight="bold">
      <textPath href="#curve" startOffset="50%" textAnchor="middle">
        SERVING WITH LOVE
      </textPath>
    </text>
  </svg>
);

function App() {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('activeSection') || 'home';
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  });
  const [adminImages, setAdminImages] = useState<string[]>([]);
  const [guestImages, setGuestImages] = useState<GuestImage[]>([]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem('isAdminLoggedIn', String(isAdminLoggedIn));
  }, [isAdminLoggedIn]);

  useEffect(() => {
    fetchAdminImages();
    fetchGuestImages();
  }, []);

  const fetchAdminImages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/images');
      const data = await response.json();
      setAdminImages(data);
    } catch (error) {
      console.error('Failed to fetch admin images:', error);
    }
  };

  const fetchGuestImages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/guest-images');
      const data = await response.json();
      setGuestImages(data);
    } catch (error) {
      console.error('Failed to fetch guest images:', error);
    }
  };

  const handleAddAdminImages = (newImages: string[]) => {
    setAdminImages(prev => [...prev, ...newImages]);
  };

  const handleAddGuestImages = (newImages: GuestImage[]) => {
    setGuestImages(prev => [...prev, ...newImages]);
  };

  const handleDeleteImage = async (imageUrl: string, type: 'admin' | 'guest') => {
    try {
      const filename = imageUrl.split('/').pop();
      const response = await fetch(`http://localhost:5000/api/images/${type}/${filename}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        if (type === 'admin') {
          setAdminImages(prev => prev.filter(img => img !== imageUrl));
        } else {
          setGuestImages(prev => prev.filter(img => img.url !== imageUrl));
        }
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo-container">
              <Logo />
              <div>
                <h1>El Seibo Mission</h1>
                <p className="tagline">Serving with compassion in the Dominican Republic</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav>
        <div className="container">
          <ul>
            <li><a className={activeSection === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('home')}>Home</a></li>
            <li><a className={activeSection === 'about' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('about')}>About</a></li>
            <li><a className={activeSection === 'services' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('services')}>Services</a></li>
            <li><a className={activeSection === 'images' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('images')}>Images</a></li>
            <li><a className={activeSection === 'guest-upload' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('guest-upload')}>Guests</a></li>
            <li><a className={activeSection === 'sponsors' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('sponsors')}>Sponsors</a></li>
            <li><a className={activeSection === 'donate' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('donate')}>Donate</a></li>
            <li><a className={activeSection === 'contact' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('contact')}>Contact</a></li>
            <li><a className={activeSection === 'admin' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('admin')}>Admin</a></li>
          </ul>
        </div>
      </nav>

      <main>
        {activeSection === 'home' && <HomeSection />}
        {activeSection === 'about' && <AboutSection />}
        {activeSection === 'services' && <ServicesSection />}
        {activeSection === 'images' && <ImagesSection uploadedImages={adminImages} />}
        {activeSection === 'guest-upload' && (
          <GuestUploadSection 
            onAddImages={handleAddGuestImages} 
            onDeleteImage={(url) => handleDeleteImage(url, 'guest')}
            guestImages={guestImages} 
          />
        )}
        {activeSection === 'sponsors' && <SponsorsSection onContactClick={() => setActiveSection('contact')} />}
        {activeSection === 'donate' && <DonateSection />}
        {activeSection === 'contact' && <ContactSection />}
        {activeSection === 'admin' && (
          <AdminSection 
            onAddImages={handleAddAdminImages} 
            onDeleteImage={(url: string) => handleDeleteImage(url, 'admin')} 
            onDeleteGuestImage={(url: string) => handleDeleteImage(url, 'guest')}
            uploadedImages={adminImages} 
            guestImages={guestImages}
            isLoggedIn={isAdminLoggedIn}
            setIsLoggedIn={setIsAdminLoggedIn}
          />
        )}
      </main>

      <footer>
        <div className="container">
          <p>&copy; 2024 El Seibo Mission. Serving with love and compassion.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Matthew 25:40 - "Whatever you did for one of the least of these brothers and sisters of mine, you did for me."</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
