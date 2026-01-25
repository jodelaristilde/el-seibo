import { useState } from 'react';

interface ImagesSectionProps {
  uploadedImages: string[];
}

const ImagesSection = ({ uploadedImages }: ImagesSectionProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openModal = (img: string) => {
    setSelectedImage(img);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  return (
    <section id="images">
      <div className="container">
        <h2 className="section-title">Image Gallery</h2>
        
        <div className="gallery" id="gallery">
          {/* Uploaded Images */}
          {uploadedImages.map((img, index) => (
            <div key={index} className="gallery-item" onClick={() => openModal(img)} style={{ cursor: 'pointer' }}>
              <img src={img} alt={`Gallery Image ${index}`} />
            </div>
          ))}

          {uploadedImages.length === 0 && (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#666', marginTop: '2rem' }}>
              No images have been uploaded yet.
            </p>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <img src={selectedImage} alt="Fullscreen View" />
          </div>
        </div>
      )}
    </section>
  );
};

export default ImagesSection;
