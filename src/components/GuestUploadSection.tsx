import { useState, type ChangeEvent } from 'react';
import { type GuestImage } from '../App';
import { isVideoUrl } from '../utils/fileUtils';

interface GuestUploadSectionProps {
  onAddImages: (images: GuestImage[]) => void;
  onDeleteImage: (imageUrl: string) => void;
  onRefresh: () => void;
  guestImages: GuestImage[];
}

const GuestUploadSection = ({ onAddImages, onDeleteImage, onRefresh, guestImages }: GuestUploadSectionProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setAlert({ type: 'error', message: 'Name and guest password are required.' });
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'guest' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setIsUnlocked(true);
        setShowLoginModal(false);
        setAlert(null);
      } else {
        setAlert({ type: 'error', message: data.error || 'Invalid guest password' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Connection error' });
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one image.' });
      return;
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (increased for videos)
    const fileList = Array.from(files);
    
    for (const file of fileList) {
      if (file.size > MAX_FILE_SIZE) {
        setAlert({ 
          type: 'error', 
          message: `File "${file.name}" is too large (>${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB).` 
        });
        e.target.value = '';
        return;
      }
    }

    setIsUploading(true);
    const totalFiles = fileList.length;
    let completedCount = 0;
    const uploadedImages: GuestImage[] = [];
    const failures: string[] = [];

    // Import utilities dynamically to keep the component light
    const { convertHeicToJpeg, getMimeType } = await import('../utils/fileUtils');

    // Controlled Concurrency: Process in batches of 2 to avoid crashing mobile browsers
    const CONCURRENCY_LIMIT = 2;
    const uploadTask = async (originalFile: File) => {
      try {
        // Safari/iOS fix: Convert HEIC to JPEG for better visibility and reliability
        const file = await convertHeicToJpeg(originalFile);
        const contentType = file.type || getMimeType(file.name);

        // 1. Get Presigned URL
        const presignedRes = await fetch('/api/generate-presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType, type: 'guest' }),
        });

        if (!presignedRes.ok) {
          const err = await presignedRes.json();
          throw new Error(err.error || 'Authorization failed');
        }
        const { uploadUrl, key } = await presignedRes.json();

        // 2. Upload Binary directly to Tigris
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 
            'Content-Type': contentType,
            'x-amz-acl': 'public-read' // Crucial for Tigris/S3 when ACL is used in signing
          },
        });

        if (!uploadRes.ok) throw new Error('Cloud upload failed');

        // 3. Finalize
        const finalizeRes = await fetch('/api/finalize-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, owner: username, type: 'guest' }),
        });

        if (!finalizeRes.ok) throw new Error('Finalization failed');
        
        const { image } = await finalizeRes.json();
        uploadedImages.push(image);
      } catch (error) {
        console.error(`Failed to upload ${originalFile.name}:`, error);
        failures.push(originalFile.name);
      } finally {
        completedCount++;
        setAlert({ 
          type: 'success', 
          message: `Uploading your memories... (${completedCount}/${totalFiles})` 
        });
      }
    };

    // Process tasks with concurrency limit
    const queue = [...fileList];
    const workers = Array(Math.min(CONCURRENCY_LIMIT, queue.length)).fill(null).map(async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (file) await uploadTask(file);
      }
    });

    await Promise.all(workers);

    onAddImages(uploadedImages);
    onRefresh();

    if (failures.length === 0) {
      setAlert({ type: 'success', message: `Successfully shared all ${uploadedImages.length} moments!` });
    } else if (uploadedImages.length > 0) {
      setAlert({ 
        type: 'error', 
        message: `Uploaded ${uploadedImages.length} images, but ${failures.length} failed. Try uploading those again.` 
      });
    } else {
      setAlert({ type: 'error', message: 'All uploads failed. Please check your connection and try again.' });
    }

    setIsUploading(false);
    setTimeout(() => setAlert(null), 6000);
    e.target.value = '';
  };

  const openLightbox = (img: string) => {
    setSelectedImage(img);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const totalPages = Math.ceil(guestImages.length / itemsPerPage);
  const currentItems = guestImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const myPhotos = guestImages.filter(img => img.owner === username);

  return (
    <section id="guest-upload">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, textAlign: 'left' }}>Mission Photos</h2>
            <p style={{ marginTop: '0.5rem', color: '#666' }}>Shared moments from our community and volunteers.</p>
          </div>
          {!isUnlocked ? (
            <button onClick={() => setShowLoginModal(true)} style={{ background: '#2c5aa0' }}>
              Guests Upload
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#e8f4fd', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #2c5aa0' }}>
                Signed in as <strong>{username}</strong>
              </div>
              <button onClick={() => { setIsUnlocked(false); setUsername(''); setPassword(''); }} style={{ background: '#666', padding: '0.5rem 1rem' }}>Logout</button>
            </div>
          )}
        </div>

        {isUnlocked && (
          <div style={{ marginBottom: '4rem' }}>
            <div className="upload-area" style={{ marginBottom: '2rem', border: '2px dashed #2c5aa0', background: '#f0f7ff' }}>
              <h3 style={{ color: '#2c5aa0' }}>Upload Your Community Photos</h3>
              <p style={{ margin: '1rem 0' }}>Share your mission experience with the world.</p>
              <div className="form-group" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <input 
                  type="file" 
                  accept="image/*,video/*,.heic,.heif" 
                  multiple 
                  onChange={handleUpload} 
                  disabled={isUploading} 
                />
                {isUploading && <p style={{ marginTop: '0.8rem', color: '#2c5aa0', fontWeight: 'bold', fontSize: '0.9rem' }}>Please wait, uploading...</p>}
              </div>
              {alert && <div className={`alert ${alert.type}`}>{alert.message}</div>}
            </div>

            <h3 style={{ color: '#2c5aa0', marginBottom: '1.5rem', borderBottom: '2px solid #e8f4fd', paddingBottom: '0.5rem' }}>My Uploads ({myPhotos.length})</h3>
            <div className="gallery">
              {myPhotos.length === 0 ? (
                <p style={{ color: '#999', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>You haven't uploaded any photos yet.</p>
              ) : (
                myPhotos.map((img, index) => (
                  <div key={img.url} className="gallery-item" style={{ position: 'relative' }}>
                    {isVideoUrl(img.url) ? (
                      <video 
                        src={img.url} 
                        onClick={() => openLightbox(img.url)} 
                        muted
                        playsInline
                        preload="metadata"
                        style={{ cursor: 'pointer', width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <img src={img.url} alt={`Mine ${index}`} onClick={() => openLightbox(img.url)} style={{ cursor: 'pointer' }} />
                    )}
                    <button 
                      onClick={() => onDeleteImage(img.url)}
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        background: 'rgba(231, 76, 60, 0.9)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        padding: '5px 10px', 
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                    <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.7rem', padding: '4px 8px', textAlign: 'center' }}>
                      My Photo
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <h3 style={{ color: '#2c5aa0', marginBottom: '1.5rem', borderBottom: '2px solid #e8f4fd', paddingBottom: '0.5rem' }}>All Community Photos ({guestImages.length})</h3>
        <div className="gallery">
          {guestImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f9f9f9', borderRadius: '8px', gridColumn: '1 / -1' }}>
              <p style={{ color: '#999', fontSize: '1.2rem' }}>No mission photos have been uploaded yet.</p>
              {!isUnlocked && <p style={{ marginTop: '1rem' }}>Be the first to share! Click "Guest Upload" to begin.</p>}
            </div>
          ) : (
            currentItems.map((img, index) => (
              <div key={img.url} className="gallery-item" onClick={() => openLightbox(img.url)} style={{ cursor: 'pointer', position: 'relative' }}>
                {isVideoUrl(img.url) ? (
                  <video 
                    src={img.url} 
                    muted
                    playsInline
                    preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <img src={img.url} alt={`Mission Guest ${index}`} />
                )}
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(255,255,255,0.8)', color: '#333', fontSize: '0.65rem', padding: '4px', textAlign: 'center', fontWeight: '600' }}>
                  By: {img.owner}
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '0.6rem 1.2rem', background: currentPage === 1 ? '#ccc' : '#2c5aa0' }}
            >
              Previous
            </button>
            <span style={{ fontWeight: '600', color: '#666' }}>Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '0.6rem 1.2rem', background: currentPage === totalPages ? '#ccc' : '#2c5aa0' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)} style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', maxWidth: '450px', width: '90%', height: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'block' }}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)} style={{ color: '#333', top: '15px', right: '15px', fontSize: '1.5rem' }}>&times;</button>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#2c5aa0', fontSize: '1.8rem', fontWeight: 'bold' }}>Guests Upload Access</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="login-form" style={{ boxShadow: 'none', padding: 0, background: 'transparent' }}>
              <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666', lineHeight: '1.4' }}>Enter your name and the guest password provided by the mission admin.</p>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#444' }}>Your Name</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Enter your full name" 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.8rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#444' }}>Guest Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter guest password" 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#2c5aa0', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold' }}>Enter Gallery</button>
              {alert && <div className={`alert ${alert.type}`} style={{ marginTop: '1.2rem', textAlign: 'center', padding: '0.8rem' }}>{alert.message}</div>}
            </form>
            <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#888' }}>
              Don't have credentials? Please contact the mission administrator.
            </p>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeLightbox}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <button className="modal-close" onClick={closeLightbox}>&times;</button>
            
            {/* Navigation Arrows */}
            {guestImages.length > 1 && (
              <>
                <button 
                  className="nav-btn prev-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = guestImages.findIndex(img => img.url === selectedImage);
                    if (currentIndex !== -1) {
                      const prevIndex = (currentIndex - 1 + guestImages.length) % guestImages.length;
                      setSelectedImage(guestImages[prevIndex].url);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  aria-label="Previous Image"
                >
                  &#10094;
                </button>
                <button 
                  className="nav-btn next-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = guestImages.findIndex(img => img.url === selectedImage);
                    if (currentIndex !== -1) {
                      const nextIndex = (currentIndex + 1) % guestImages.length;
                      setSelectedImage(guestImages[nextIndex].url);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  aria-label="Next Image"
                >
                  &#10095;
                </button>
              </>
            )}

            {isVideoUrl(selectedImage) ? (
              <video src={selectedImage} controls autoPlay style={{ maxWidth: '100%', maxHeight: '90vh' }} />
            ) : (
              <img src={selectedImage} alt="Fullscreen View" />
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default GuestUploadSection;
