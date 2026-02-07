import { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { useContent } from './ContentProvider';
import { getCroppedImg } from '../utils/cropUtils';

interface HomeBannerProps {
  isAdmin: boolean;
}

const HomeBanner = ({ isAdmin }: HomeBannerProps) => {
  const { content, updateContent } = useContent();
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Crop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Swipe state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Load images from content
  useEffect(() => {
    let loadedImages: string[] = [];
    if (content.home_banner_images) {
      try {
        loadedImages = JSON.parse(content.home_banner_images);
      } catch (e) {
        console.error("Failed to parse home_banner_images", e);
      }
    }
    
    // Fallback to legacy keys if array is empty
    if (loadedImages.length === 0) {
      const legacy = [
        content.home_banner_image_1,
        content.home_banner_image_2,
        content.home_banner_image_3
      ].filter(Boolean);
      if (legacy.length > 0) loadedImages = legacy;
    }

    setImages(loadedImages);
  }, [content]);

  // Auto-rotate
  useEffect(() => {
    if (images.length <= 1 || isEditing || cropImage) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length, isEditing, cropImage]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Image Upload Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setCropImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveCroppedImage = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    
    setIsUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error('Failed to crop image');

      const fileName = `banner_${Date.now()}.jpg`;
      const file = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });
      const contentType = 'image/jpeg';

      // 1. Get Presigned URL
      const presignedRes = await fetch('/api/generate-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType, type: 'site_asset' }),
      });

      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, key, publicUrl } = await presignedRes.json();

      // 2. Upload Binary
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 
          'Content-Type': contentType,
          'x-amz-acl': 'public-read'
        },
      });

      if (!uploadRes.ok) throw new Error('Cloud upload failed');

      // 3. Finalize
      const finalizeRes = await fetch('/api/finalize-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, type: 'site_asset' }),
      });

      if (!finalizeRes.ok) throw new Error('Finalization failed');

      // 4. Update Content
      const newImages = [...images, publicUrl];
      await updateContent('home_banner_images', JSON.stringify(newImages));
      setImages(newImages);
      setCropImage(null);
      setCurrentIndex(newImages.length - 1); // Switch to new image
      
    } catch (error) {
      console.error('Failed to upload banner:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (indexToDelete: number) => {
    if (!window.confirm('Are you sure you want to remove this image?')) return;
    
    const newImages = images.filter((_, idx) => idx !== indexToDelete);
    try {
       await updateContent('home_banner_images', JSON.stringify(newImages));
       setImages(newImages);
       if (currentIndex >= newImages.length) setCurrentIndex(Math.max(0, newImages.length - 1));
    } catch (error) {
      console.error('Failed to update images:', error);
    }
  };

  if (images.length === 0 && !isAdmin) return null;

  return (
    <div className="home-banner-container" style={{ position: 'relative', width: '100%', maxWidth: '1200px', margin: '2rem auto', overflow: 'hidden' }}>
      
      {/* Admin Controls */}
      {isAdmin && (
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <button 
            onClick={() => setIsEditing(true)}
            style={{
              background: '#2c5aa0',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            Manage Banner Images ({images.length}/4)
          </button>
        </div>
      )}

      {/* Carousel */}
      <div 
        className="carousel-wrapper"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', background: '#f0f0f0' }}
      >
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentIndex]} 
              alt={`Banner ${currentIndex + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.5s ease-in-out'
              }}
            />
            
            {/* Arrows */}
            {images.length > 1 && (
              <>
                 <button 
                   onClick={handlePrev}
                   style={{
                     position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                     background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '50%',
                     width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                   }}
                 >
                   ‹
                 </button>
                 <button 
                   onClick={handleNext}
                   style={{
                     position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                     background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '50%',
                     width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                   }}
                 >
                   ›
                 </button>
              </>
            )}

            {/* Dots */}
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem' }}>
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                      border: 'none', cursor: 'pointer', padding: 0
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            No images. click "Manage Banner Images" to add some.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ flexDirection: 'column', background: 'white', width: '90%', maxWidth: '600px', height: 'auto', maxHeight: '90vh', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
              <h3 style={{ margin: 0, color: '#2c5aa0' }}>Manage Banners</h3>
              <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginBottom: '2rem', width: '100%' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '16/9' }}>
                  <img src={img} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  <button 
                    onClick={() => deleteImage(idx)}
                    style={{
                      position: 'absolute', top: -5, right: -5, background: '#e74c3c', color: 'white',
                      border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer',
                      fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #ccc', borderRadius: '4px', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    fontSize: '2rem', color: '#ccc', aspectRatio: '16/9'
                  }}
                >
                  +
                </button>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept="image/*" 
            />
            
            <div style={{ textAlign: 'right' }}>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropImage && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
           <div className="modal-content" style={{ 
            background: 'white', width: '90%', maxWidth: '600px', 
            height: 'auto', maxHeight: '90vh', padding: '2rem', 
            borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.5rem'
          }}>
            <h3 style={{ margin: 0, color: '#2c5aa0', textAlign: 'center' }}>Crop Banner Image</h3>
            
            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div style={{ padding: '0 1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="edit-controls">
              <button 
                className="cancel-btn" 
                onClick={() => setCropImage(null)}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={saveCroppedImage}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Save & Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeBanner;
