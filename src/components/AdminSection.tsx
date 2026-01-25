import { useState, type ChangeEvent, useEffect } from 'react';
import { type GuestImage } from '../App';

interface User {
  username: string;
}

interface AdminSectionProps {
  onAddImages: (images: string[]) => void;
  onDeleteImage: (imageUrl: string) => void;
  onDeleteGuestImage: (imageUrl: string) => void;
  uploadedImages: string[];
  guestImages: GuestImage[];
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const AdminSection = ({ 
  onAddImages, 
  onDeleteImage, 
  onDeleteGuestImage, 
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
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const imagesPerPage = 12;

  useEffect(() => {
    if (isLoggedIn && activeTab === 'users') {
      fetchUsers();
    }
  }, [isLoggedIn, activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
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

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one image.' });
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onAddImages(data.images);
        setAlert({ type: 'success', message: `Successfully uploaded ${files.length} image(s)!` });
      } else {
        setAlert({ type: 'error', message: 'Failed to upload images.' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setAlert({ type: 'error', message: 'Server error during upload.' });
    }

    setTimeout(() => setAlert(null), 3000);
    e.target.value = '';
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      setAlert({ type: 'error', message: 'Username and password are required' });
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      if (response.ok) {
        setAlert({ type: 'success', message: 'Guest user created successfully' });
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      } else {
        const data = await response.json();
        setAlert({ type: 'error', message: data.error || 'Failed to create user' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Connection error' });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDeleteUser = async (uName: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${uName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
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
            <div className="login-form">
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button onClick={handleLogin}>Login</button>
              {alert && <div className={`alert ${alert.type}`}>{alert.message}</div>}
            </div>
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
                <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#f39c12' : '#ccc', flex: 1 }}>Manage Guest Auth</button>
            </div>

            {activeTab === 'images' && (
              <>
                <div className="upload-area">
                  <h3>Upload Main Gallery Images</h3>
                  <div className="form-group" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <input type="file" accept="image/*" multiple onChange={handleUpload} />
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
                <h3 style={{ textAlign: 'center' }}>Guest User Accounts</h3>
                <div className="login-form" style={{ boxShadow: 'none', background: '#f9f9f9', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>New Guest Username</label>
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>New Guest Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <button onClick={handleCreateUser} style={{ background: '#f39c12' }}>Create Guest Account</button>
                  {alert && <div className={`alert ${alert.type}`}>{alert.message}</div>}
                </div>
                
                <div style={{ marginTop: '2rem' }}>
                  <h4>Current Guest Accounts</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {users.map(u => (
                      <li key={u.username} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                        <span>{u.username}</span>
                        <button onClick={() => handleDeleteUser(u.username)} style={{ background: '#e74c3c', fontSize: '0.8rem', padding: '4px 8px' }}>Delete Account</button>
                      </li>
                    ))}
                  </ul>
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
