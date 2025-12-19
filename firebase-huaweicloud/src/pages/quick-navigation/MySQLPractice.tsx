import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import {
  ArrowLeft,
  Code2,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Copy,
  Play,
} from 'lucide-react';
import '../../styles/DashboardPage.css';

interface MySQLExercise {
  id: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions: string;
  expectedOutput?: string;
  hints: string[];
  category: string;
}

const mysqlExercises: MySQLExercise[] = [
  {
    id: 1,
    title: 'Create Your First Table',
    description: 'Create a table named "students" with basic columns',
    difficulty: 'Beginner',
    category: 'DDL - CREATE',
    instructions: 'Create a table named "students" with columns: id (INT, PRIMARY KEY), name (VARCHAR(100)), email (VARCHAR(100)), age (INT). Make id auto-increment.',
    expectedOutput: 'CREATE TABLE students (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(100),\n  age INT\n);',
    hints: [
      'Use CREATE TABLE syntax',
      'PRIMARY KEY constraint is needed for id',
      'Use AUTO_INCREMENT for auto-generating IDs',
      'VARCHAR is for variable-length strings'
    ],
  },
  {
    id: 2,
    title: 'Insert Data into Table',
    description: 'Insert a record into a table',
    difficulty: 'Beginner',
    category: 'DML - INSERT',
    instructions: 'Insert a new student record: name="John Doe", email="john@example.com", age=20 into the students table.',
    expectedOutput: 'INSERT INTO students (name, email, age) VALUES (\'John Doe\', \'john@example.com\', 20);',
    hints: [
      'Use INSERT INTO syntax',
      'Specify columns if not inserting all',
      'String values must be wrapped in single quotes',
      'You don\'t need to specify id as it auto-increments'
    ],
  },
  {
    id: 3,
    title: 'Select All Records',
    description: 'Retrieve all records from a table',
    difficulty: 'Beginner',
    category: 'DML - SELECT',
    instructions: 'Write a query to select all records and all columns from the students table.',
    expectedOutput: 'SELECT * FROM students;',
    hints: [
      'Use SELECT * syntax',
      '* means all columns',
      'FROM specifies the table',
      'Always end with semicolon'
    ],
  },
  {
    id: 4,
    title: 'Select Specific Columns',
    description: 'Retrieve specific columns from a table',
    difficulty: 'Beginner',
    category: 'DML - SELECT',
    instructions: 'Select only the name and email columns from the students table.',
    expectedOutput: 'SELECT name, email FROM students;',
    hints: [
      'List specific column names separated by commas',
      'You don\'t need to specify the * wildcard',
      'FROM indicates the source table',
      'This reduces data transfer and improves performance'
    ],
  },
  {
    id: 5,
    title: 'Filter with WHERE',
    description: 'Filter records based on conditions',
    difficulty: 'Beginner',
    category: 'DML - WHERE',
    instructions: 'Select all students where age is greater than 18.',
    expectedOutput: 'SELECT * FROM students WHERE age > 18;',
    hints: [
      'WHERE clause filters rows',
      'Use comparison operators: >, <, =, !=, >=, <=',
      'Only matching records are returned',
      'Multiple conditions can be combined with AND/OR'
    ],
  },
  {
    id: 6,
    title: 'Update Records',
    description: 'Modify existing data in a table',
    difficulty: 'Intermediate',
    category: 'DML - UPDATE',
    instructions: 'Update John Doe\'s email to "john.doe@newmail.com" where his current email is "john@example.com".',
    expectedOutput: 'UPDATE students SET email = \'john.doe@newmail.com\' WHERE email = \'john@example.com\';',
    hints: [
      'Use UPDATE keyword with table name',
      'SET specifies which columns to update',
      'WHERE clause is CRITICAL to avoid updating all records',
      'Always use WHERE unless you want to update everything'
    ],
  },
  {
    id: 7,
    title: 'Delete Records',
    description: 'Remove records from a table',
    difficulty: 'Intermediate',
    category: 'DML - DELETE',
    instructions: 'Delete all students where age is less than 18.',
    expectedOutput: 'DELETE FROM students WHERE age < 18;',
    hints: [
      'Use DELETE FROM syntax',
      'WHERE clause specifies which records to delete',
      'Without WHERE, ALL records are deleted',
      'Be very careful with DELETE operations!'
    ],
  },
  {
    id: 8,
    title: 'Add a Column',
    description: 'Modify table structure by adding a new column',
    difficulty: 'Intermediate',
    category: 'DDL - ALTER',
    instructions: 'Add a new column "phone" (VARCHAR(20)) to the students table.',
    expectedOutput: 'ALTER TABLE students ADD COLUMN phone VARCHAR(20);',
    hints: [
      'Use ALTER TABLE to modify structure',
      'ADD COLUMN adds a new column',
      'Specify data type for the new column',
      'You can add multiple columns in one statement'
    ],
  },
  {
    id: 9,
    title: 'Sort Results',
    description: 'Order query results by a column',
    difficulty: 'Intermediate',
    category: 'DML - ORDER BY',
    instructions: 'Select all students ordered by name in ascending order.',
    expectedOutput: 'SELECT * FROM students ORDER BY name ASC;',
    hints: [
      'Use ORDER BY to sort results',
      'ASC = ascending (A to Z), DESC = descending (Z to A)',
      'Default is ASC if not specified',
      'Can order by multiple columns'
    ],
  },
  {
    id: 10,
    title: 'Limit Results',
    description: 'Restrict the number of returned rows',
    difficulty: 'Intermediate',
    category: 'DML - LIMIT',
    instructions: 'Select the first 5 students from the students table.',
    expectedOutput: 'SELECT * FROM students LIMIT 5;',
    hints: [
      'LIMIT restricts the number of rows returned',
      'Useful for pagination',
      'Can be combined with ORDER BY',
      'LIMIT 5 OFFSET 10 skips first 10 rows'
    ],
  },
  {
    id: 11,
    title: 'Count Records',
    description: 'Use aggregate functions to count rows',
    difficulty: 'Intermediate',
    category: 'DML - AGGREGATE',
    instructions: 'Count how many students are in the students table.',
    expectedOutput: 'SELECT COUNT(*) FROM students;',
    hints: [
      'COUNT(*) counts all rows',
      'COUNT(column) counts non-null values',
      'Other aggregates: SUM, AVG, MIN, MAX',
      'These functions summarize data'
    ],
  },
  {
    id: 12,
    title: 'Join Two Tables',
    description: 'Combine data from multiple tables',
    difficulty: 'Advanced',
    category: 'DML - JOIN',
    instructions: 'Given a "courses" table with course_id and course_name, write a query to get student names and their enrolled courses (assuming a junction table "enrollments" with student_id and course_id).',
    expectedOutput: 'SELECT s.name, c.course_name FROM students s\nINNER JOIN enrollments e ON s.id = e.student_id\nINNER JOIN courses c ON e.course_id = c.course_id;',
    hints: [
      'JOIN combines rows from multiple tables',
      'INNER JOIN returns only matching records',
      'LEFT JOIN includes unmatched rows from left table',
      'Use aliases (s, c, e) to refer to tables'
    ],
  },
  {
    id: 13,
    title: 'Group and Aggregate',
    description: 'Group rows and apply aggregate functions',
    difficulty: 'Advanced',
    category: 'DML - GROUP BY',
    instructions: 'Group students by age and count how many students are in each age group.',
    expectedOutput: 'SELECT age, COUNT(*) as student_count FROM students GROUP BY age;',
    hints: [
      'GROUP BY groups rows with same values',
      'Aggregate functions apply to each group',
      'Use AS to name result columns',
      'All non-grouped columns must use aggregates'
    ],
  },
  {
    id: 14,
    title: 'Create Index',
    description: 'Improve query performance with indexes',
    difficulty: 'Advanced',
    category: 'DDL - INDEX',
    instructions: 'Create an index on the email column to speed up lookups.',
    expectedOutput: 'CREATE INDEX idx_email ON students(email);',
    hints: [
      'Indexes speed up SELECT and WHERE queries',
      'Slow down INSERT and UPDATE operations',
      'Primary keys are indexed automatically',
      'Name your indexes with "idx_" prefix'
    ],
  },
];

export const MySQLPractice: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<MySQLExercise | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [showExpectedOutput, setShowExpectedOutput] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [practiceModeTab, setPracticeModeTab] = useState<'guided' | 'freeform'>('guided');
  const [freeformQuery, setFreeformQuery] = useState('');
  const [freeformResult, setFreeformResult] = useState<{ type: 'success' | 'error' | null; message: string; details?: string }>({ type: null, message: '' });

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const normalizeSQL = (sql: string): string => {
    return sql
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase()
      .replace(/[;`'"]/g, '');
  };

  const checkSyntax = () => {
    if (!selectedExercise) return;

    const userNormalized = normalizeSQL(userQuery);
    const expectedNormalized = normalizeSQL(selectedExercise.expectedOutput || '');

    if (userNormalized === expectedNormalized) {
      setResult({ type: 'success', message: '✓ Perfect! Your syntax is correct!' });
    } else {
      setResult({ type: 'error', message: '✗ Syntax is not quite right. Check the hints or try the solution.' });
    }
  };

  const showSolution = () => {
    setUserQuery(selectedExercise?.expectedOutput || '');
    setResult({ type: 'success', message: 'Solution loaded. Study and modify it to learn better!' });
  };

  const filteredExercises = mysqlExercises.filter(exercise => {
    const matchesFilter = difficultyFilter === 'all' || exercise.difficulty === difficultyFilter;
    return matchesFilter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setResult({ type: 'success', message: 'Copied to clipboard!' });
  };

  const checkFreeformSyntax = async () => {
    if (!freeformQuery.trim()) {
      setFreeformResult({ type: 'error', message: 'Please enter a query', details: '' });
      return;
    }

    try {
      const query = freeformQuery.trim();
      const queryUpper = query.toUpperCase();
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for common SQL keywords
      const hasValidKeyword = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|JOIN|WITH)\b/.test(queryUpper);
      if (!hasValidKeyword) {
        errors.push('Query must start with a valid SQL keyword (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, JOIN)');
      }

      // Check for semicolon
      if (!query.trim().endsWith(';')) {
        warnings.push('Query should end with a semicolon (;)');
      }

      // Check for matching parentheses
      const openParen = (query.match(/\(/g) || []).length;
      const closeParen = (query.match(/\)/g) || []).length;
      if (openParen !== closeParen) {
        errors.push(`Mismatched parentheses: ${openParen} opening, ${closeParen} closing`);
      }

      // Check for matching quotes
      const singleQuotes = (query.match(/'/g) || []).length;
      const doubleQuotes = (query.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push('Mismatched single quotes (odd number)');
      }
      if (doubleQuotes % 2 !== 0) {
        errors.push('Mismatched double quotes (odd number)');
      }

      // Check for common mistakes
      if (/\bWHERE\b/i.test(query) && !/\bWHERE\b\s+.+\b(=|<|>|!=|<=|>=|IN|LIKE|BETWEEN|IS)\b/i.test(query)) {
        warnings.push('WHERE clause may be missing a comparison operator (=, <, >, !=, <=, >=, IN, LIKE, BETWEEN, IS)');
      }

      // Check for SELECT without FROM (if it's not a simple SELECT)
      if (/^\s*SELECT\b/i.test(query) && !/\bFROM\b/i.test(query) && !/\b(1|NOW|CURRENT_DATE|CURRENT_TIME|USER|VERSION)\b/i.test(query)) {
        warnings.push('SELECT statement may be missing a FROM clause');
      }

      // Check for proper JOIN syntax
      if (/\bJOIN\b/i.test(query) && !/\bON\b/i.test(query)) {
        errors.push('JOIN statement requires an ON clause to specify the join condition');
      }

      // Check for UPDATE without WHERE (dangerous!)
      if (/^\s*UPDATE\b/i.test(query) && !/\bWHERE\b/i.test(query)) {
        warnings.push('⚠️ UPDATE without WHERE will modify ALL records! Add a WHERE clause unless this is intentional');
      }

      // Check for DELETE without WHERE (dangerous!)
      if (/^\s*DELETE\b/i.test(query) && !/\bWHERE\b/i.test(query)) {
        warnings.push('⚠️ DELETE without WHERE will remove ALL records! Add a WHERE clause unless this is intentional');
      }

      // Check for GROUP BY without aggregate
      if (/\bGROUP\s+BY\b/i.test(query) && !/\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(query)) {
        warnings.push('GROUP BY often works with aggregate functions (COUNT, SUM, AVG, MIN, MAX)');
      }

      if (errors.length > 0) {
        const errorMsg = errors.map((e, i) => `❌ ${i + 1}. ${e}`).join('\n');
        const warningMsg = warnings.length > 0 ? '\n' + warnings.map((w, i) => `⚠️  ${i + 1}. ${w}`).join('\n') : '';
        setFreeformResult({ 
          type: 'error', 
          message: 'Syntax errors found:', 
          details: errorMsg + warningMsg
        });
      } else {
        let detailsMsg = '✓ Your query passed basic validation!';
        if (warnings.length > 0) {
          detailsMsg += '\n\nWarnings:\n' + warnings.map((w, i) => `⚠️  ${i + 1}. ${w}`).join('\n');
          setFreeformResult({ 
            type: 'error', 
            message: 'Query validated with warnings:', 
            details: detailsMsg
          });
        } else {
          setFreeformResult({ 
            type: 'success', 
            message: 'Query syntax is valid!',
            details: 'Your query passed all basic validation checks. Make sure the logic is correct for your use case.'
          });
        }
      }
    } catch (error) {
      setFreeformResult({ type: 'error', message: 'Error checking syntax', details: String(error) });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(233, 69, 96, 0.3)',
            borderTop: '3px solid #e94560',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-content">
          <div className="nav-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button 
              className="menu-toggle"
              onClick={() => navigate(-1)}
              style={{ marginLeft: '8px', padding: '8px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-logo">
              <div className="logo-icon" style={{ backgroundColor: '#10b981' }}>
                <Code2 size={16} />
              </div>
              <span className="nav-title">MySQL Practice</span>
            </div>
          </div>

          <div className="nav-right">
            <div className="profile-section">
              <div className="profile-info">
                <div className="profile-name">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="profile-role">Student</div>
              </div>
              <div 
                className="profile-avatar"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="profile-avatar-image"
                  />
                ) : (
                  <span style={{ color: '#10b981', fontWeight: '700' }}>
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}
                
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <p>{user.email}</p>
                    </div>
                    <div className="dropdown-items">
                      <button className="dropdown-item">
                        <User size={16} /> Profile
                      </button>
                      <button className="dropdown-item">
                        <Settings size={16} /> Settings
                      </button>
                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item danger"
                        onClick={handleLogout}
                        disabled={logoutLoading}
                      >
                        <LogOut size={16} /> {logoutLoading ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar - Exercise List */}
        <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              Practice Mode
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button
                onClick={() => {
                  setPracticeModeTab('guided');
                  setSelectedExercise(null);
                  setUserQuery('');
                  setResult({ type: null, message: '' });
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: practiceModeTab === 'guided' ? '#10b981' : 'var(--color-border)',
                  color: practiceModeTab === 'guided' ? 'white' : 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                Guided Exercises
              </button>
              <button
                onClick={() => {
                  setPracticeModeTab('freeform');
                  setSelectedExercise(null);
                  setFreeformQuery('');
                  setFreeformResult({ type: null, message: '' });
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: practiceModeTab === 'freeform' ? '#10b981' : 'var(--color-border)',
                  color: practiceModeTab === 'freeform' ? 'white' : 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                Free-form Practice
              </button>
            </div>
          </div>

          {practiceModeTab === 'guided' && (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Exercises
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  flex: 1,
                }}
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="sidebar-items">
            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => {
                  setSelectedExercise(exercise);
                  setUserQuery('');
                  setResult({ type: null, message: '' });
                  setShowHints(false);
                  setPracticeModeTab('guided');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: selectedExercise?.id === exercise.id ? 'var(--color-border)' : 'transparent',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: selectedExercise?.id === exercise.id ? '600' : '400',
                  transition: 'all 0.2s',
                  marginBottom: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  if (selectedExercise?.id !== exercise.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedExercise?.id !== exercise.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{exercise.id}. {exercise.title}</span>
                <span style={{ fontSize: '11px', color: getDifficultyColor(exercise.difficulty), fontWeight: '500' }}>
                  {exercise.category}
                </span>
              </button>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-tip">
              <div className="sidebar-tip-label">Pro Tip</div>
              <div className="sidebar-tip-text">
                Start with Beginner exercises and work your way up!
              </div>
            </div>
          </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          {practiceModeTab === 'freeform' && !selectedExercise ? (
            // Free-form Practice Mode (No Exercise Selected)
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Free-form Header */}
              <div style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}>
                    <h2 style={{ margin: 0, color: 'var(--color-text)' }}>
                      Free-form SQL Practice
                    </h2>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      No Restrictions
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Write any SQL query and get real-time syntax validation
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                  marginTop: '16px',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#3b82f6', textTransform: 'uppercase' }}>
                    Instructions
                  </p>
                  <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '14px', lineHeight: '1.6' }}>
                    Write any SQL query you want. The syntax checker will validate your query structure and help identify errors.
                  </p>
                </div>
              </div>

              {/* Free-form Practice Area */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}>
                {/* Code Editor */}
                <div style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    <Code2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Your Query
                  </h3>
                  <textarea
                    value={freeformQuery}
                    onChange={(e) => setFreeformQuery(e.target.value)}
                    placeholder="Write your SQL query here...&#10;Example: SELECT * FROM users WHERE age > 18;"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#1e1e1e',
                      color: '#d4d4d4',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      resize: 'none',
                      minHeight: '200px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={checkFreeformSyntax}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Play size={16} />
                      Check Syntax
                    </button>
                    <button
                      onClick={() => setFreeformQuery('')}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Clear
                    </button>
                  </div>

                  {freeformResult.type && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: freeformResult.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${freeformResult.type === 'success' ? '#10b981' : '#ef4444'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      color: freeformResult.type === 'success' ? '#10b981' : '#ef4444',
                      fontSize: '13px',
                      fontWeight: '500',
                      flexDirection: 'column',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {freeformResult.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {freeformResult.message}
                      </div>
                      {freeformResult.details && (
                        <pre style={{
                          margin: '8px 0 0 0',
                          padding: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'monospace',
                        }}>
                          {freeformResult.details}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    <Lightbulb size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Common SQL Patterns
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {[
                      { title: 'SELECT', code: 'SELECT * FROM table_name;' },
                      { title: 'INSERT', code: 'INSERT INTO table (col1, col2) VALUES (val1, val2);' },
                      { title: 'UPDATE', code: 'UPDATE table SET col = value WHERE condition;' },
                      { title: 'DELETE', code: 'DELETE FROM table WHERE condition;' },
                      { title: 'JOIN', code: 'SELECT * FROM t1 JOIN t2 ON t1.id = t2.id;' },
                      { title: 'GROUP BY', code: 'SELECT col, COUNT(*) FROM table GROUP BY col;' },
                    ].map((pattern, idx) => (
                      <div key={idx} style={{
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderLeft: '3px solid #3b82f6',
                      }}>
                        <div style={{ fontWeight: '600', color: '#3b82f6', fontSize: '12px', marginBottom: '4px' }}>
                          {pattern.title}
                        </div>
                        <code style={{
                          fontSize: '11px',
                          color: 'var(--color-text-secondary)',
                          wordBreak: 'break-all',
                          fontFamily: 'monospace',
                        }}>
                          {pattern.code}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : !selectedExercise ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
              <Code2 size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>Welcome to MySQL Practice</h2>
              <p>Select an exercise from the left to get started and master MySQL commands</p>
              
              {/* Tab Navigation */}
              <div style={{
                marginTop: '32px',
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                padding: '24px',
              }}>
                <button
                  onClick={() => setPracticeModeTab('guided')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: practiceModeTab === 'guided' ? '#10b981' : 'var(--color-border)',
                    color: practiceModeTab === 'guided' ? 'white' : 'var(--color-text)',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Guided Exercises
                </button>
                <button
                  onClick={() => setPracticeModeTab('freeform')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: practiceModeTab === 'freeform' ? '#10b981' : 'var(--color-border)',
                    color: practiceModeTab === 'freeform' ? 'white' : 'var(--color-text)',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Free-form Practice
                </button>
              </div>

              {/* Show Guided or Freeform info */}
              {practiceModeTab === 'guided' && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid #10b981',
                  color: 'var(--color-text)',
                }}>
                  <p>Select an exercise from the left sidebar to practice guided SQL problems</p>
                </div>
              )}

              {practiceModeTab === 'freeform' && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid #3b82f6',
                  color: 'var(--color-text)',
                }}>
                  <p>Create your own SQL queries and get real-time syntax feedback</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Exercise Header */}
              <div style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}>
                    <h2 style={{ margin: 0, color: 'var(--color-text)' }}>
                      {selectedExercise.id}. {selectedExercise.title}
                    </h2>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: `${getDifficultyColor(selectedExercise.difficulty)}20`,
                      color: getDifficultyColor(selectedExercise.difficulty),
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {selectedExercise.difficulty}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    {selectedExercise.description}
                  </p>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: '500' }}>
                    Category: {selectedExercise.category}
                  </p>
                </div>

                {/* Instructions */}
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(233, 69, 96, 0.05)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #e94560',
                  marginTop: '16px',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#e94560', textTransform: 'uppercase' }}>
                    Task
                  </p>
                  <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '14px', lineHeight: '1.6' }}>
                    {selectedExercise.instructions}
                  </p>
                </div>
              </div>

              {/* Practice Area */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}>
                {/* Code Editor */}
                <div style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    <Code2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Your Query
                  </h3>
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Write your MySQL query here..."
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#1e1e1e',
                      color: '#d4d4d4',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      resize: 'none',
                      minHeight: '200px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={checkSyntax}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Play size={16} />
                      Check Syntax
                    </button>
                    <button
                      onClick={showSolution}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Lightbulb size={16} />
                      Show Solution
                    </button>
                  </div>

                  {result.type && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: result.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${result.type === 'success' ? '#10b981' : '#ef4444'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: result.type === 'success' ? '#10b981' : '#ef4444',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}>
                      {result.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                      {result.message}
                    </div>
                  )}
                </div>

                {/* Reference & Hints */}
                <div style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    <Lightbulb size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Hints & Solution
                  </h3>

                  {/* Expected Output */}
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={() => setShowExpectedOutput(!showExpectedOutput)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: showExpectedOutput ? 'var(--color-border)' : 'transparent',
                        color: 'var(--color-text)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        marginBottom: '12px',
                      }}
                    >
                      <span>Show Expected Output</span>
                      <ChevronRight size={16} style={{ transform: showExpectedOutput ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </button>

                    {showExpectedOutput && (
                      <div style={{
                        backgroundColor: '#1e1e1e',
                        padding: '12px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#d4d4d4',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        position: 'relative',
                      }}>
                        <button
                          onClick={() => copyToClipboard(selectedExercise.expectedOutput || '')}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#d4d4d4',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        >
                          <Copy size={12} />
                          Copy
                        </button>
                        {selectedExercise.expectedOutput}
                      </div>
                    )}
                  </div>

                  {/* Hints */}
                  <div>
                    <button
                      onClick={() => setShowHints(!showHints)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: showHints ? 'var(--color-border)' : 'transparent',
                        color: 'var(--color-text)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        marginBottom: '12px',
                      }}
                    >
                      <span>Show Hints</span>
                      <ChevronRight size={16} style={{ transform: showHints ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </button>

                    {showHints && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedExercise.hints.map((hint, index) => (
                          <div 
                            key={index}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderLeft: '3px solid #3b82f6',
                              fontSize: '13px',
                              color: 'var(--color-text)',
                              lineHeight: '1.4',
                            }}
                          >
                            <span style={{ fontWeight: '600', color: '#3b82f6' }}>Hint {index + 1}:</span> {hint}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
