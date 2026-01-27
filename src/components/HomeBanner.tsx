import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useContent } from './ContentProvider';
import { getCroppedImg } from '../utils/cropUtils';

interface HomeBannerProps {
  isAdmin: boolean;
}

const HomeBanner = ({ isAdmin }: HomeBannerProps) => {
  const { content, updateContent } = useContent();
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageClick = (slot: number) => {
    if (!isAdmin) return;
    setActiveSlot(slot);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeSlot === null || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImage(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!image || !croppedAreaPixels || activeSlot === null) return;
    
    setIsUploading(activeSlot);
    try {
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error('Failed to crop image');

      const file = new File([croppedImageBlob], `home_banner_${activeSlot}.jpg`, { type: 'image/jpeg' });
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

      // 4. Update Site Content
      await updateContent(`home_banner_image_${activeSlot}`, publicUrl);
      setImage(null);
    } catch (error) {
      console.error('Failed to upload home banner image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(null);
      setActiveSlot(null);
    }
  };

  const handleCancel = () => {
    setImage(null);
    setActiveSlot(null);
  };

  const handleDelete = async (e: React.MouseEvent, slot: number) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to remove this image?')) {
      try {
        await updateContent(`home_banner_image_${slot}`, '');
      } catch (error) {
        console.error('Failed to delete home banner image:', error);
      }
    }
  };

  const images = [
    content['home_banner_image_1'],
    content['home_banner_image_2'],
    content['home_banner_image_3'],
  ].filter(Boolean);

  // If no images and not admin, don't show anything
  if (images.length === 0 && !isAdmin) return null;

  return (
    <div className="home-banner-container" style={{ 
      background: 'white', 
      padding: '2rem', 
      borderRadius: '12px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      margin: '2rem auto',
      maxWidth: '1000px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      alignItems: 'center'
    }}>
      <div className="home-banner-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${Math.max(1, isAdmin ? 3 : images.length)}, 1fr)`,
        gap: '1.5rem',
        width: '100%'
      }}>
        {[1, 2, 3].map((slot) => {
          const imageUrl = content[`home_banner_image_${slot}`];
          if (!isAdmin && !imageUrl) return null;

          return (
            <div 
              key={slot}
              onClick={() => handleImageClick(slot)}
              style={{
                aspectRatio: '16/9',
                background: '#f8f9fa',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                cursor: isAdmin ? 'pointer' : 'default',
                border: isAdmin ? '2px dashed #ddd' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {imageUrl ? (
                <>
                  <img 
                    src={imageUrl} 
                    alt={`Banner ${slot}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDelete(e, slot)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'rgba(231, 76, 60, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '12px',
                        zIndex: 5
                      }}
                      title="Remove Image"
                    >
                      ✕
                    </button>
                  )}
                </>
              ) : isAdmin ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block' }}>+</span>
                  <span style={{ fontSize: '0.8rem' }}>Add Image {slot}</span>
                </div>
              ) : null}

              {isAdmin && (
                <div className="edit-overlay" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'white',
                  borderRadius: '8px'
                }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}>
                  <span>Change Image</span>
                </div>
              )}


              {isUploading === slot && (
                <div style={{
                  position: 'absolute',
                  background: 'rgba(255,255,255,0.8)',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#2c5aa0', fontWeight: 'bold' }}>Uploading...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        style={{ display: 'none' }} 
        accept="image/*" 
      />

      {image && (
        <div className="modal-overlay" style={{ zIndex: 10000, cursor: 'default' }}>
          <div className="modal-content" style={{ 
            background: 'white', 
            width: '90%', 
            maxWidth: '600px', 
            height: 'auto', 
            maxHeight: '90vh',
            padding: '2rem',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: 0, color: '#2c5aa0', textAlign: 'center' }}>Crop Banner Image</h3>
            
            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div style={{ padding: '0 1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="edit-controls" style={{ marginTop: '0.5rem' }}>
              <button 
                className="cancel-btn" 
                onClick={handleCancel}
                disabled={isUploading !== null}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleSave}
                disabled={isUploading !== null}
              >
                {isUploading !== null ? 'Saving...' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeBanner;

