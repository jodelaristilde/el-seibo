import { useState } from 'react';
import { isVideoUrl } from '../utils/fileUtils';

interface ImagesSectionProps {
  uploadedImages: string[];
}

const ImagesSection = ({ uploadedImages }: ImagesSectionProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const openModal = (img: string) => {
    setSelectedImage(img);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  const totalPages = Math.ceil(uploadedImages.length / itemsPerPage);
  const currentItems = uploadedImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section id="images">
      <div className="container">
        <h2 className="section-title">Image Gallery</h2>
        
        <div className="gallery" id="gallery">
          {/* Uploaded Images */}
          {currentItems.map((img, index) => (
            <div key={index} className="gallery-item" onClick={() => openModal(img)} style={{ cursor: 'pointer' }}>
              {isVideoUrl(img) ? (
                <video src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={img} alt={`Gallery Image ${index}`} />
              )}
            </div>
          ))}

          {uploadedImages.length === 0 && (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#666', marginTop: '2rem' }}>
              No images have been uploaded yet.
            </p>
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

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
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

export default ImagesSection;
