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
import { useContent } from './components/ContentProvider';
import EditableText from './components/EditableText';
import EditableImage from './components/EditableImage';
import VolunteerSection from './components/VolunteerSection';

export interface GuestImage {
  url: string;
  filename: string;
  owner: string;
}

// Static Logo helper removed in favor of EditableImage

function App() {
  const { content } = useContent();
  const [activeSection, setActiveSection] = useState('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  });
  const [adminImages, setAdminImages] = useState<string[]>([]);
  const [guestImages, setGuestImages] = useState<GuestImage[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  useEffect(() => {
    setIsMenuOpen(false); // Close menu when section changes
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem('isAdminLoggedIn', String(isAdminLoggedIn));
  }, [isAdminLoggedIn]);

  // Sync favicon with site logo
  useEffect(() => {
    const siteLogo = content.site_logo || '/logo.png';
    const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = siteLogo;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = siteLogo;
      document.head.appendChild(newLink);
    }
  }, [content.site_logo]);

  useEffect(() => {
    fetchAdminImages();
    fetchGuestImages();
  }, []);

  const fetchAdminImages = async () => {
    try {
      const response = await fetch('/api/images');
      const data = await response.json();
      setAdminImages(data);
    } catch (error) {
      console.error('Failed to fetch admin images:', error);
    }
  };

  const fetchGuestImages = async () => {
    try {
      const response = await fetch('/api/guest-images');
      const data = await response.json();
      setGuestImages(data);
    } catch (error) {
      console.error('Failed to fetch guest images:', error);
    }
  };

  const handleAddAdminImages = (newImages: string[]) => {
    setAdminImages(prev => [...newImages, ...prev]);
  };

  const handleAddGuestImages = (newImages: GuestImage[]) => {
    setGuestImages(prev => [...newImages, ...prev]);
  };

  const handleDeleteImage = async (imageUrl: string, type: 'admin' | 'guest') => {
    try {
      const filename = imageUrl.split('/').pop();
      const response = await fetch(`/api/images/${type}/${filename}`, {
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
              <EditableImage 
                contentKey="site_logo" 
                defaultImage="/logo.png"
                isAdmin={isAdminLoggedIn} 
                aspect={1}
                cropShape="rect"
                innerClassName="logo"
                imageStyle={{ borderRadius: '8px', objectFit: 'contain' }}
              />
              <div className="header-text">
                <EditableText 
                  contentKey="site_title" 
                  defaultText="El Seibo Mission" 
                  isAdmin={isAdminLoggedIn} 
                  tagName="h1" 
                />
                <EditableText 
                  contentKey="site_tagline" 
                  defaultText="Serving with compassion in the Dominican Republic" 
                  isAdmin={isAdminLoggedIn} 
                  tagName="p" 
                  className="tagline"
                />
              </div>
            </div>
            <button 
              className="menu-toggle" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      <nav className={isMenuOpen ? 'nav-open' : ''}>
        <div className="container">
          <ul>
            <li><a className={activeSection === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('home')}>Home</a></li>
            <li><a className={activeSection === 'about' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('about')}>About</a></li>
            <li><a className={activeSection === 'services' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('services')}>Services</a></li>
            <li><a className={activeSection === 'images' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('images')}>Images</a></li>
            <li><a className={activeSection === 'volunteer' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('volunteer')}>Volunteer Stories</a></li>
            <li><a className={activeSection === 'guest-upload' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('guest-upload')}>Guests Upload</a></li>
            <li><a className={activeSection === 'sponsors' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('sponsors')}>Sponsors</a></li>
            <li><a className={activeSection === 'donate' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('donate')}>Donate</a></li>
            <li><a className={activeSection === 'contact' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('contact')}>Contact</a></li>
            <li><a className={activeSection === 'admin' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveSection('admin')}>Admin</a></li>
          </ul>
        </div>
      </nav>

      <main>
        {activeSection === 'home' && <HomeSection isAdmin={isAdminLoggedIn} />}
        {activeSection === 'about' && <AboutSection isAdmin={isAdminLoggedIn} />}
        {activeSection === 'services' && <ServicesSection isAdmin={isAdminLoggedIn} />}
        {activeSection === 'images' && <ImagesSection uploadedImages={adminImages} />}
        {activeSection === 'volunteer' && <VolunteerSection isAdmin={isAdminLoggedIn} />}
        {activeSection === 'guest-upload' && (
          <GuestUploadSection 
            onAddImages={handleAddGuestImages} 
            onDeleteImage={(url) => handleDeleteImage(url, 'guest')}
            onRefresh={fetchGuestImages}
            guestImages={guestImages} 
          />
        )}
        {activeSection === 'sponsors' && <SponsorsSection onContactClick={() => setActiveSection('contact')} isAdmin={isAdminLoggedIn} />}
        {activeSection === 'donate' && <DonateSection isAdmin={isAdminLoggedIn} />}
        {activeSection === 'contact' && <ContactSection isAdmin={isAdminLoggedIn} />}
        {activeSection === 'admin' && (
          <AdminSection 
            onAddImages={handleAddAdminImages} 
            onDeleteImage={(url: string) => handleDeleteImage(url, 'admin')} 
            onDeleteGuestImage={(url: string) => handleDeleteImage(url, 'guest')}
            onRefresh={() => { fetchAdminImages(); fetchGuestImages(); }}
            uploadedImages={adminImages} 
            guestImages={guestImages}
            isLoggedIn={isAdminLoggedIn}
            setIsLoggedIn={setIsAdminLoggedIn}
          />
        )}
      </main>

      <footer>
        <div className="container">
          <EditableText 
            contentKey="footer_copy" 
            defaultText="© 2026 El Seibo Mission. Serving with love and compassion." 
            isAdmin={isAdminLoggedIn} 
            tagName="p" 
          />
          <EditableText 
            contentKey="footer_verse" 
            defaultText='Matthew 25:40 - "Whatever you did for one of the least of these brothers and sisters of mine, you did for me."' 
            isAdmin={isAdminLoggedIn} 
            tagName="p" 
            style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
          />
        </div>
      </footer>
    </div>
  );
}

export default App;
