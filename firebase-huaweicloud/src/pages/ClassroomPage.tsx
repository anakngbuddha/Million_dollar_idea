import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import {
  Plus,
  Users,
  Lock,
  Globe,
  Search,
  X,
  Check,
  Copy,
  AlertCircle,
  BookOpen,
  UserPlus,
  LogIn,
  Calendar,
  Hash,
} from 'lucide-react';
import '../styles/Classroom.css';

interface Classroom {
  id: string;
  name: string;
  code: string;
  isPublic: boolean;
  maxMembers: number;
  authorId: string;
  authorName: string;
  authorEmail: string;
  members: string[];
  createdAt: any;
  description?: string;
}

type ModalType = 'create' | 'join' | null;

export const ClassroomPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [myClassrooms, setMyClassrooms] = useState<Classroom[]>([]);
  const [publicClassrooms, setPublicClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

  // Create classroom form state
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    isPublic: false,
    maxMembers: 50,
    description: '',
  });

  // Join classroom form state
  const [joinCode, setJoinCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate random class code
  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Fetch classrooms
  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const fetchClassrooms = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const classroomsRef = collection(db, 'classrooms');

      // Fetch classrooms where user is a member
      const myClassQuery = query(
        classroomsRef,
        where('members', 'array-contains', user.uid)
      );
      const myClassSnapshot = await getDocs(myClassQuery);
      const myClasses = myClassSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Classroom[];

      setMyClassrooms(myClasses);

      // Fetch public classrooms
      const publicQuery = query(
        classroomsRef,
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const publicSnapshot = await getDocs(publicQuery);
      const publicClasses = publicSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Classroom[];

      setPublicClassrooms(publicClasses);
    } catch (err) {
      console.error('Error fetching classrooms:', err);
      setError('Failed to load classrooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!createForm.name.trim()) {
      setError('Class name is required');
      return;
    }

    if (!createForm.isPublic && !createForm.code.trim()) {
      setError('Class code is required for private classes');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const classroomsRef = collection(db, 'classrooms');

      // Check if code already exists (for private classes)
      if (!createForm.isPublic) {
        const codeQuery = query(classroomsRef, where('code', '==', createForm.code));
        const codeSnapshot = await getDocs(codeQuery);
        if (!codeSnapshot.empty) {
          setError('This class code is already in use');
          setIsSubmitting(false);
          return;
        }
      }

      const newClassroom = {
        name: createForm.name,
        code: createForm.isPublic ? '' : createForm.code,
        isPublic: createForm.isPublic,
        maxMembers: createForm.maxMembers,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorEmail: user.email || '',
        members: [user.uid],
        createdAt: serverTimestamp(),
        description: createForm.description || '',
      };

      await addDoc(classroomsRef, newClassroom);

      setSuccess('Classroom created successfully!');
      setActiveModal(null);
      setCreateForm({
        name: '',
        code: '',
        isPublic: false,
        maxMembers: 50,
        description: '',
      });

      setTimeout(() => setSuccess(null), 3000);
      fetchClassrooms();
    } catch (err) {
      console.error('Error creating classroom:', err);
      setError('Failed to create classroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!joinCode.trim()) {
      setError('Class code is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const classroomsRef = collection(db, 'classrooms');
      const codeQuery = query(classroomsRef, where('code', '==', joinCode.toUpperCase()));
      const codeSnapshot = await getDocs(codeQuery);

      if (codeSnapshot.empty) {
        setError('Class not found. Please check the code.');
        setIsSubmitting(false);
        return;
      }

      const classDoc = codeSnapshot.docs[0];
      const classData = classDoc.data() as Classroom;

      // Check if already a member
      if (classData.members.includes(user.uid)) {
        setError('You are already a member of this class');
        setIsSubmitting(false);
        return;
      }

      // Check if class is full
      if (classData.members.length >= classData.maxMembers) {
        setError('This class has reached its maximum capacity');
        setIsSubmitting(false);
        return;
      }

      // Add user to class
      const classRef = doc(db, 'classrooms', classDoc.id);
      await updateDoc(classRef, {
        members: arrayUnion(user.uid),
      });

      setSuccess('Successfully joined the classroom!');
      setActiveModal(null);
      setJoinCode('');

      setTimeout(() => setSuccess(null), 3000);
      fetchClassrooms();
    } catch (err) {
      console.error('Error joining classroom:', err);
      setError('Failed to join classroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinPublicClass = async (classId: string) => {
    if (!user) return;

    try {
      const classRef = doc(db, 'classrooms', classId);
      const classSnap = await getDoc(classRef);

      if (!classSnap.exists()) {
        setError('Class not found');
        return;
      }

      const classData = classSnap.data() as Classroom;

      // Check if already a member
      if (classData.members.includes(user.uid)) {
        setError('You are already a member of this class');
        return;
      }

      // Check if class is full
      if (classData.members.length >= classData.maxMembers) {
        setError('This class has reached its maximum capacity');
        return;
      }

      await updateDoc(classRef, {
        members: arrayUnion(user.uid),
      });

      setSuccess('Successfully joined the classroom!');
      setTimeout(() => setSuccess(null), 3000);
      fetchClassrooms();
    } catch (err) {
      console.error('Error joining public classroom:', err);
      setError('Failed to join classroom');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Code copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const filteredMyClassrooms = myClassrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicClassrooms = publicClassrooms.filter(
    classroom =>
      classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !classroom.members.includes(user?.uid || '')
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="classroom-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading classrooms...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="classroom-container">
        {/* Header */}
        <div className="classroom-header">
          <div className="header-content">
            <div className="header-left">
              <BookOpen size={32} className="header-icon" />
              <div>
                <h1>Classrooms</h1>
                <p>Create and join classes to collaborate</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setActiveModal('join')}
              >
                <LogIn size={18} />
                Join Class
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setActiveModal('create')}
              >
                <Plus size={18} />
                Create Class
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="alert-close">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <Check size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search classrooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <Users size={18} />
            My Classes ({myClassrooms.length})
          </button>
          <button
            className={`tab ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            <Globe size={18} />
            Public Classes ({filteredPublicClassrooms.length})
          </button>
        </div>

        {/* Classroom Grid */}
        <div className="classroom-grid">
          {activeTab === 'my' ? (
            filteredMyClassrooms.length > 0 ? (
              filteredMyClassrooms.map((classroom) => (
                <div 
                  key={classroom.id} 
                  className="classroom-card"
                  onClick={() => navigate(`/classrooms/${classroom.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-header">
                    <div className="card-title">
                      <h3>{classroom.name}</h3>
                      {classroom.isPublic ? (
                        <Globe size={16} className="icon-public" />
                      ) : (
                        <Lock size={16} className="icon-private" />
                      )}
                    </div>
                    {!classroom.isPublic && classroom.code && (
                      <button
                        className="code-badge"
                        onClick={() => copyToClipboard(classroom.code)}
                        title="Copy code"
                      >
                        <Hash size={14} />
                        {classroom.code}
                        <Copy size={12} />
                      </button>
                    )}
                  </div>

                  {classroom.description && (
                    <p className="card-description">{classroom.description}</p>
                  )}

                  <div className="card-info">
                    <div className="info-item">
                      <Users size={16} />
                      <span>
                        {classroom.members.length} / {classroom.maxMembers} members
                      </span>
                    </div>
                    <div className="info-item">
                      <Calendar size={16} />
                      <span>
                        {classroom.createdAt?.toDate
                          ? new Date(classroom.createdAt.toDate()).toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="author-info">
                      <div className="author-avatar">
                        {classroom.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="author-name">{classroom.authorName}</p>
                        <p className="author-label">Instructor</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <BookOpen size={64} />
                <h3>No classes yet</h3>
                <p>Create or join a class to get started</p>
              </div>
            )
          ) : filteredPublicClassrooms.length > 0 ? (
            filteredPublicClassrooms.map((classroom) => (
              <div 
                key={classroom.id} 
                className="classroom-card"
                onClick={() => navigate(`/classrooms/${classroom.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header">
                  <div className="card-title">
                    <h3>{classroom.name}</h3>
                    <Globe size={16} className="icon-public" />
                  </div>
                </div>

                {classroom.description && (
                  <p className="card-description">{classroom.description}</p>
                )}

                <div className="card-info">
                  <div className="info-item">
                    <Users size={16} />
                    <span>
                      {classroom.members.length} / {classroom.maxMembers} members
                    </span>
                  </div>
                  <div className="info-item">
                    <Calendar size={16} />
                    <span>
                      {classroom.createdAt?.toDate
                        ? new Date(classroom.createdAt.toDate()).toLocaleDateString()
                        : 'Recently'}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="author-info">
                    <div className="author-avatar">
                      {classroom.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="author-name">{classroom.authorName}</p>
                      <p className="author-label">Instructor</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleJoinPublicClass(classroom.id)}
                    disabled={classroom.members.length >= classroom.maxMembers}
                  >
                    <UserPlus size={16} />
                    Join
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Globe size={64} />
              <h3>No public classes available</h3>
              <p>Check back later for new classes</p>
            </div>
          )}
        </div>

        {/* Create Classroom Modal */}
        {activeModal === 'create' && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Create a New Classroom</h2>
                  <p className="modal-subtitle">Set up your learning space and invite students</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="modal-close">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateClassroom} className="modal-form">
                {/* Basic Information Section */}
                <div className="form-section">
                  <h3 className="section-title">Basic Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="class-name">Class Name <span className="required">*</span></label>
                    <input
                      id="class-name"
                      type="text"
                      placeholder="e.g., Introduction to React 2025"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, name: e.target.value })
                      }
                      required
                    />
                    <p className="form-help">Give your classroom a clear, descriptive name</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="class-desc">Description</label>
                    <textarea
                      id="class-desc"
                      placeholder="Describe what students will learn in this class..."
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, description: e.target.value })
                      }
                      rows={4}
                    />
                    <p className="form-help">Optional: Help students understand the course content</p>
                  </div>
                </div>

                {/* Visibility Section */}
                <div className="form-section">
                  <h3 className="section-title">Class Visibility</h3>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="visibility"
                        checked={!createForm.isPublic}
                        onChange={() => setCreateForm({ ...createForm, isPublic: false })}
                      />
                      <div className="radio-icon">
                        <Lock size={20} />
                      </div>
                      <div className="radio-content">
                        <strong>Private Classroom</strong>
                        <span>Students need a code to join</span>
                      </div>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="visibility"
                        checked={createForm.isPublic}
                        onChange={() => setCreateForm({ ...createForm, isPublic: true })}
                      />
                      <div className="radio-icon">
                        <Globe size={20} />
                      </div>
                      <div className="radio-content">
                        <strong>Public Classroom</strong>
                        <span>Anyone can join without a code</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Private Class Settings */}
                {!createForm.isPublic && (
                  <div className="form-section">
                    <h3 className="section-title">Access Code</h3>
                    <div className="form-group">
                      <label htmlFor="class-code">Class Code <span className="required">*</span></label>
                      <div className="input-with-button">
                        <input
                          id="class-code"
                          type="text"
                          placeholder="XXXX1234"
                          value={createForm.code}
                          onChange={(e) =>
                            setCreateForm({
                              ...createForm,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          required={!createForm.isPublic}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setCreateForm({ ...createForm, code: generateClassCode() })
                          }
                        >
                          <Hash size={16} />
                          Generate
                        </button>
                      </div>
                      <p className="form-help">Share this code with students so they can join</p>
                    </div>
                  </div>
                )}

                {/* Capacity Section */}
                <div className="form-section">
                  <h3 className="section-title">Class Capacity</h3>
                  <div className="form-group">
                    <label htmlFor="max-members">Maximum Members</label>
                    <input
                      id="max-members"
                      type="number"
                      min="2"
                      max="500"
                      value={createForm.maxMembers}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          maxMembers: parseInt(e.target.value) || 50,
                        })
                      }
                    />
                    <p className="form-help">Set a limit on how many students can join (2-500)</p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveModal(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Classroom'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Classroom Modal */}
        {activeModal === 'join' && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Join a Classroom</h2>
                  <p className="modal-subtitle">Enter the classroom code to get started</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="modal-close">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleJoinClassroom} className="modal-form">
                <div className="form-group-large">
                  <label htmlFor="join-code">Classroom Code <span className="required">*</span></label>
                  <input
                    id="join-code"
                    type="text"
                    placeholder="Enter the code (e.g., ABC12345)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    required
                    autoFocus
                    className="join-code-input"
                  />
                  <p className="form-help">Ask your instructor for the classroom code</p>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveModal(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Joining...' : 'Join Classroom'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ClassroomPage;