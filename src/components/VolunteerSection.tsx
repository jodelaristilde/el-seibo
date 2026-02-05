import { useState, useEffect } from 'react';
import EditableText from './EditableText';

interface Video {
  id: string;
  url: string;
  title: string;
}

const getYouTubeEmbedUrl = (url: string) => {
  let videoId = '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      const vParam = parsed.searchParams.get('v');
      if (vParam) videoId = vParam;
      else if (parsed.pathname.startsWith('/embed/')) videoId = parsed.pathname.split('/')[2];
    }
  } catch (e) {
    return null;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const VolunteerSection = ({ isAdmin }: { isAdmin: boolean }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (err) {
      console.error('Failed to fetch videos', err);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newTitle) {
      setError('Please provide both a title and a YouTube URL.');
      return;
    }
    
    // Validate URL client-side too
    if (!getYouTubeEmbedUrl(newUrl)) {
        setError('Invalid YouTube URL. Please use a standard watch link or share link.');
        return;
    }

    setIsAdding(true);
    setError('');

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, title: newTitle }),
      });
      
      if (res.ok) {
        const { video } = await res.json();
        setVideos(prev => [video, ...prev]);
        setNewUrl('');
        setNewTitle('');
      } else {
        setError('Failed to save video.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVideos(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <section id="volunteer">
      <div className="container">
        <h2 className="section-title">Volunteer Stories</h2>
        <EditableText 
          contentKey="volunteer_intro" 
          defaultText="Hear from the hearts of those who serve. Our volunteers share their inspiring journeys and the lives they've touched." 
          isAdmin={isAdmin} 
          tagName="p" 
          style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}
        />

        {isAdmin && (
          <div style={{ background: '#f0f7ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #cce5ff' }}>
            <h3 style={{ color: '#2c5aa0', marginTop: 0 }}>Add New Story</h3>
            <form onSubmit={handleAddVideo} style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Video Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Sarah's Journey in El Seibo"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>YouTube Link</label>
                <input 
                  type="text" 
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }} 
                />
              </div>
              {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
              <button 
                type="submit" 
                disabled={isAdding}
                style={{ justifySelf: 'start', background: '#2c5aa0', padding: '0.6rem 1.2rem', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {isAdding ? 'Adding...' : 'Add Story'}
              </button>
            </form>
          </div>
        )}

        {videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666', background: '#fafafa', borderRadius: '8px' }}>
                <p>No stories have been shared yet. Check back soon!</p>
            </div>
        ) : (
            <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
            gap: '2rem',
            alignItems: 'start'
            }}>
            {videos.map(video => {
                const embedUrl = getYouTubeEmbedUrl(video.url);
                return (
                <div key={video.id} className="video-card" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{video.title}</h3>
                    {isAdmin && (
                        <button 
                        onClick={() => handleDelete(video.id)}
                        style={{ background: 'transparent', color: '#dc3545', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        title="Delete Video"
                        >
                        &times;
                        </button>
                    )}
                    </div>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                    {embedUrl ? (
                        <iframe 
                        src={embedUrl} 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        title={video.title}
                        ></iframe>
                    ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        Invalid Video Link
                        </div>
                    )}
                    </div>
                </div>
                );
            })}
            </div>
        )}
      </div>
    </section>
  );
};

export default VolunteerSection;
