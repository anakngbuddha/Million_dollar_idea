import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  Phone,
  MapPin,
  Briefcase,
  Save,
  AlertCircle,
  CheckCircle,
  Mail,
  Calendar,
  Shield,
  User,
  X,
} from 'lucide-react';
import '../styles/DashboardPage.css';

interface ProfileData {
  displayName: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  profession?: string;
  photoURL?: string;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    displayName: '',
    phoneNumber: '',
    location: '',
    bio: '',
    profession: '',
    photoURL: ''
  });


  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) {
        navigate('/dashboard');
        return;
      }

      try {
        setIsLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as ProfileData;
          setFormData({
            displayName: data.displayName || user.displayName || '',
            phoneNumber: data.phoneNumber || '',
            location: data.location || '',
            bio: data.bio || '',
            profession: data.profession || '',
            photoURL: data.photoURL || user.photoURL || ''
          });
        } else {
          // If no Firestore data, use Firebase auth data
          setFormData({
            displayName: user.displayName || '',
            phoneNumber: '',
            location: '',
            bio: '',
            profession: '',
            photoURL: user.photoURL || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Still set form data from Firebase auth even if Firestore fails
        setFormData({
          displayName: user.displayName || '',
          phoneNumber: '',
          location: '',
          bio: '',
          profession: '',
          photoURL: user.photoURL || ''
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not found');
      return;
    }

    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: formData.displayName,
      });

      // Try to update Firestore, but don't fail if it doesn't exist
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber || null,
          location: formData.location || null,
          bio: formData.bio || null,
          profession: formData.profession || null,
          updatedAt: new Date(),
        });
      } catch (firestoreError) {
        console.warn('Firestore update failed, but Firebase Auth was updated:', firestoreError);
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="dashboard-container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(233, 69, 96, 0.3)',
              borderTop: '3px solid #e94560',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="dashboard-container">
      <div className="dashboard-layout">
        {/* Main Content */}
        <main className="main-content">
          
          {/* Header */}
          <div className="content-header">
            <h1>Profile Settings</h1>
            <p>Manage your account information and preferences.</p>
          </div>

          {/* Alerts */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '16px',
              marginBottom: '24px',
              borderRadius: '10px',
              fontSize: '14px',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#ff6b7a'
            }}>
              <AlertCircle size={20} style={{ marginRight: '12px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '16px',
              marginBottom: '24px',
              borderRadius: '10px',
              fontSize: '14px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80'
            }}>
              <CheckCircle size={20} style={{ marginRight: '12px', flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Profile Form */}
          <div style={{
            background: 'var(--color-card-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '32px',
            backdropFilter: 'blur(10px)',
            marginBottom: '24px'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Personal Information Section */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <User size={20} style={{ marginRight: '10px', color: 'var(--color-accent-light)' }} />
                  <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)'
                  }}>Personal Information</h2>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--color-text-primary)',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>Display Name *</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="Enter your display name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        background: 'var(--color-input-bg)',
                        color: 'var(--color-text-primary)',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--color-text-primary)',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>Email Address</label>
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-secondary)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <Mail size={16} />
                      {user?.email}
                    </div>
                    <div style={{
                      background: 'rgba(233, 69, 96, 0.1)',
                      borderLeft: '3px solid var(--color-accent-light)',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      marginTop: '12px',
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.6'
                    }}>
                      Email cannot be changed. Contact support if you need to update it.
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--color-text-primary)',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        background: 'var(--color-input-bg)',
                        color: 'var(--color-text-primary)',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <Briefcase size={20} style={{ marginRight: '10px', color: 'var(--color-accent-light)' }} />
                  <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)'
                  }}>Additional Information</h2>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--color-text-primary)',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>Profession</label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      placeholder="e.g., Software Engineer, Data Scientist"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        background: 'var(--color-input-bg)',
                        color: 'var(--color-text-primary)',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      color: 'var(--color-text-primary)',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Your phone number"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        background: 'var(--color-input-bg)',
                        color: 'var(--color-text-primary)',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      color: 'var(--color-text-primary)',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      <MapPin size={16} />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        background: 'var(--color-input-bg)',
                        color: 'var(--color-text-primary)',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '24px',
                borderTop: '1px solid var(--color-border)'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #e94560 0%, #d62f4d 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isSaving ? 0.6 : 1
                  }}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Information Card */}
          <div style={{
            background: 'var(--color-card-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '32px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <Shield size={20} style={{ marginRight: '10px', color: 'var(--color-accent-light)' }} />
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--color-text-primary)'
              }}>Account Details</h2>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--color-border)'
              }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Account Type</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: '500', fontSize: '14px' }}>
                  {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Standard'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0'
              }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} />
                  Member Since
                </span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: '500', fontSize: '14px' }}>
                  {new Date(user.metadata.creationTime!).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </AppLayout>
  );
}

export default ProfilePage;

