import { useState, type ChangeEvent, useEffect } from 'react';
import { type GuestImage } from '../App';

interface User {
  username: string;
}

interface AdminSectionProps {
  onAddImages: (images: string[]) => void;
  onDeleteImage: (imageUrl: string) => void;
  onDeleteGuestImage: (imageUrl: string) => void;
  onRefresh: () => void;
  uploadedImages: string[];
  guestImages: GuestImage[];
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const AdminSection = ({ 
  onAddImages, 
  onDeleteImage, 
  onDeleteGuestImage, 
  onRefresh,
  uploadedImages, 
  guestImages,
  isLoggedIn,
  setIsLoggedIn
}: AdminSectionProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Removed local isLoggedIn state as it's now managed in App.tsx
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentAdminPage, setCurrentAdminPage] = useState(1);
  const [currentGuestPage, setCurrentGuestPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'images' | 'guests' | 'users'>(() => {
    return (localStorage.getItem('adminActiveTab') as 'images' | 'guests' | 'users') || 'images';
  });
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);
  const [newPassword, setNewPassword] = useState('');
  
  const imagesPerPage = 12;

  useEffect(() => {
    if (isLoggedIn && activeTab === 'users') {
      fetchUsers();
    }
  }, [isLoggedIn, activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'admin' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setIsLoggedIn(true);
        setAlert({ type: 'success', message: 'Logged in successfully!' });
        setTimeout(() => setAlert(null), 2000);
      } else {
        setAlert({ type: 'error', message: data.error || 'Invalid credentials' });
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

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for admin
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
    const uploadedUrls: string[] = [];
    const failures: string[] = [];

    // Controlled Concurrency: 2 at a time
    const CONCURRENCY_LIMIT = 2;
    const uploadTask = async (file: File) => {
      try {
        // 1. Get Presigned URL
        const presignedRes = await fetch('/api/generate-presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type, type: 'admin' }),
        });

        if (!presignedRes.ok) throw new Error('Authorization failed');
        const { uploadUrl, key, publicUrl } = await presignedRes.json();

        // 2. Upload Binary
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 
            'Content-Type': file.type,
            'x-amz-acl': 'public-read'
          },
        });

        if (!uploadRes.ok) throw new Error('Cloud upload failed');

        // 3. Finalize
        const finalizeRes = await fetch('/api/finalize-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, type: 'admin' }),
        });

        if (!finalizeRes.ok) throw new Error('Finalization failed');
        
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error(`Admin upload error for ${file.name}:`, error);
        failures.push(file.name);
      } finally {
        completedCount++;
        setAlert({ 
          type: 'success', 
          message: `Uploading gallery images... (${completedCount}/${totalFiles})` 
        });
      }
    };

    const queue = [...fileList];
    const workers = Array(Math.min(CONCURRENCY_LIMIT, queue.length)).fill(null).map(async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (file) await uploadTask(file);
      }
    });

    await Promise.all(workers);

    onAddImages(uploadedUrls);
    onRefresh();

    if (failures.length === 0) {
      setAlert({ type: 'success', message: `Successfully added ${uploadedUrls.length} images to gallery!` });
    } else {
      setAlert({ 
        type: 'error', 
        message: `Added ${uploadedUrls.length} images, but ${failures.length} failed.` 
      });
    }

    setIsUploading(false);
    setTimeout(() => setAlert(null), 5000);
    e.target.value = '';
  };

  const handleCreateUser = async () => {
    if (!newPassword) {
      setAlert({ type: 'error', message: 'Password is required' });
      return;
    }
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (response.ok) {
        setAlert({ type: 'success', message: 'Guest password added successfully' });
        setNewPassword('');
        fetchUsers();
      } else {
        const data = await response.json();
        setAlert({ type: 'error', message: data.error || 'Failed to add password' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Connection error' });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDeleteUser = async (pwd: string) => {
    try {
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete password:', error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAlert({ type: 'success', message: 'Logged out successfully.' });
    setTimeout(() => setAlert(null), 2000);
  };

  // Pagination Helper
  const getPaginatedItems = <T,>(items: T[], page: number) => {
    const start = (page - 1) * imagesPerPage;
    return items.slice(start, start + imagesPerPage);
  };

  const adminImagesToShow = getPaginatedItems(uploadedImages, currentAdminPage);
  const guestImagesToShow = getPaginatedItems(guestImages, currentGuestPage);
  const totalAdminPages = Math.ceil(uploadedImages.length / imagesPerPage);
  const totalGuestPages = Math.ceil(guestImages.length / imagesPerPage);

  return (
    <section id="admin">
      <div className="container">
        {!isLoggedIn ? (
          <div className="locked">
            <h2 className="section-title">Admin Login</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="login-form">
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit">Login</button>
              {alert && <div className={`alert ${alert.type}`}>{alert.message}</div>}
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Admin Dashboard</h2>
              <button 
                onClick={handleLogout}
                style={{ background: '#666' }}
              >
                Logout
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
                <button onClick={() => setActiveTab('images')} style={{ background: activeTab === 'images' ? '#2c5aa0' : '#ccc', flex: 1 }}>Gallery Images</button>
                <button onClick={() => setActiveTab('guests')} style={{ background: activeTab === 'guests' ? '#2c5aa0' : '#ccc', flex: 1 }}>Guest Photos</button>
                <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#f39c12' : '#ccc', flex: 1 }}>Manage Guest Passwords</button>
            </div>

            {activeTab === 'images' && (
              <>
                <div className="upload-area">
                  <h3>Upload Main Gallery Images</h3>
                  <div className="form-group" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <input 
                      type="file" 
                      accept="image/*,.heic,.heif" 
                      multiple 
                      onChange={handleUpload} 
                      disabled={isUploading} 
                    />
                    {isUploading && <p style={{ marginTop: '0.8rem', color: '#2c5aa0', fontWeight: 'bold', fontSize: '0.9rem' }}>Please wait, processing uploads...</p>}
                  </div>
                  {alert && <div className={`alert ${alert.type}`}>{alert.message}</div>}
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <h3>Gallery Management ({uploadedImages.length})</h3>
                  <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    {adminImagesToShow.map(img => (
                      <div key={img} className="admin-item" style={{ position: 'relative' }}>
                        <img src={img} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} alt="Admin" />
                        <button onClick={() => onDeleteImage(img)} style={{ position: 'absolute', top: '5px', right: '5px', padding: '2px 6px', fontSize: '0.7rem', background: '#e74c3c' }}>Delete</button>
                      </div>
                    ))}
                  </div>
                  {totalAdminPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                      <button disabled={currentAdminPage === 1} onClick={() => setCurrentAdminPage(p => p - 1)}>Prev</button>
                      <span style={{ alignSelf: 'center' }}>Page {currentAdminPage} of {totalAdminPages}</span>
                      <button disabled={currentAdminPage === totalAdminPages} onClick={() => setCurrentAdminPage(p => p + 1)}>Next</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'guests' && (
              <div style={{ marginTop: '2rem' }}>
                <h3>Guest Mission Photos ({guestImages.length})</h3>
                <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    {guestImagesToShow.map(img => (
                      <div key={img.url} className="admin-item" style={{ position: 'relative' }}>
                        <img src={img.url} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} alt="Guest" />
                        <button onClick={() => onDeleteGuestImage(img.url)} style={{ position: 'absolute', top: '5px', right: '5px', padding: '2px 6px', fontSize: '0.7rem', background: '#e74c3c' }}>Delete</button>
                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(255,255,255,0.8)', color: '#333', fontSize: '0.6rem', padding: '2px', textAlign: 'center' }}>
                          Owner: {img.owner}
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalGuestPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                      <button disabled={currentGuestPage === 1} onClick={() => setCurrentGuestPage(p => p - 1)}>Prev</button>
                      <span style={{ alignSelf: 'center' }}>Page {currentGuestPage} of {totalGuestPages}</span>
                      <button disabled={currentGuestPage === totalGuestPages} onClick={() => setCurrentGuestPage(p => p + 1)}>Next</button>
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'users' && (
               <div className="user-management" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3 style={{ textAlign: 'center' }}>Guest Password Management</h3>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>Set a shared password for your guests to use for photo uploads.</p>
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}
                  className="login-form" 
                  style={{ boxShadow: 'none', background: '#f9f9f9', marginTop: '1rem', border: '1px solid #ddd' }}
                >
                  <div className="form-group">
                    <label>Add New Password</label>
                    <input 
                      type="text" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Enter new guest password"
                      required
                    />
                  </div>
                  <button type="submit" style={{ background: '#f39c12', width: '100%' }}>Create Password</button>
                  {alert && <div className={`alert ${alert.type}`}>{alert.message}</div>}
                </form>
                
                <div style={{ marginTop: '3rem' }}>
                  <h4 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Active Guest Passwords</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {users.map((pwd, idx) => (
                      <li key={`${pwd}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fff', border: '1px solid #eee', borderRadius: '8px', marginBottom: '0.5rem', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div>
                          <span style={{ color: '#666', fontSize: '0.8rem', display: 'block' }}>Current Guest Password:</span>
                          <code style={{ background: '#e8f4fd', color: '#2c5aa0', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}>{typeof pwd === 'string' ? pwd : JSON.stringify(pwd)}</code>
                        </div>
                        <button onClick={() => handleDeleteUser(typeof pwd === 'string' ? pwd : String(pwd))} style={{ background: '#e74c3c', fontSize: '0.8rem', padding: '0.5rem 1rem', borderRadius: '4px' }}>Delete</button>
                      </li>
                    ))}
                  </ul>
                  {users.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem', fontStyle: 'italic' }}>No active guest passwords.</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminSection;
