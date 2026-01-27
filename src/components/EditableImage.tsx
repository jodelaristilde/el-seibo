import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useContent } from './ContentProvider';
import { getCroppedImg } from '../utils/cropUtils';

interface EditableImageProps {
  contentKey: string;
  defaultIcon: string;
  isAdmin: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const EditableImage = ({ contentKey, defaultIcon, isAdmin, className, style }: EditableImageProps) => {
  const { content, updateContent } = useContent();
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setIsEditing(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return;
    
    setIsUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error('Failed to crop image');

      const file = new File([croppedImageBlob], 'sponsor-icon.jpg', { type: 'image/jpeg' });
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
      await updateContent(contentKey, publicUrl);
      
      setIsEditing(false);
      setImage(null);
    } catch (error) {
      console.error('Failed to save editable image:', error);
      alert('Failed to save image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImage(null);
  };

  const currentImageUrl = content[contentKey];

  return (
    <div 
      className={`editable-container ${isAdmin ? 'admin-editable' : ''} ${className || ''}`}
      style={{ ...style, position: 'relative' }}
    >
      <div className="sponsor-logo" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentImageUrl ? (
          <img 
            src={currentImageUrl} 
            alt="Sponsor Icon" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
          />
        ) : (
          <span style={{ fontSize: '3rem' }}>{defaultIcon}</span>
        )}
      </div>

      {isAdmin && (
        <>
          <button 
            className="edit-icon-btn" 
            onClick={handleEditClick}
            title="Edit Image"
          >
            ✎
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            style={{ display: 'none' }} 
            accept="image/*"
          />
        </>
      )}

      {isEditing && (
        <div className="modal-overlay" style={{ zIndex: 10000, cursor: 'default' }}>
          <div className="modal-content" style={{ 
            background: 'white', 
            width: '90%', 
            maxWidth: '500px', 
            height: 'auto', 
            maxHeight: '90vh',
            padding: '2rem',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: 0, color: '#2c5aa0', textAlign: 'center' }}>Crop Sponsor Icon</h3>
            
            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
              <Cropper
                image={image || ''}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
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
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleSave}
                disabled={isUploading}
              >
                {isUploading ? 'Saving...' : 'Save Icon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableImage;
