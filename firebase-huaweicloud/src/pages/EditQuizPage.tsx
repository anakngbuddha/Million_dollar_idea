import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import {
  ArrowLeft,
  Trash2,
  Save,
  Copy,
  CheckSquare,
  Circle,
  List,
  Type,
  Globe,
  Lock,
  Users as UsersIcon,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { getCustomQuiz, updateCustomQuiz } from '../services/quizService';
import type {
  QuizQuestion,
  QuestionType,
  QuizVisibility,
  CustomQuiz,
} from '../services/quizService';
import { generateQuestions } from '../services/geminiService';
import type { QuestionGenerationRequest } from '../services/geminiService';
import { Timestamp } from 'firebase/firestore';
import '../styles/DashboardPage.css';
import '../styles/GeminiPanel.css';

interface QuestionTemplate {
  type: QuestionType;
  icon: React.ElementType;
  label: string;
  description: string;
}

export const EditQuizPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [geminiPanelOpen, setGeminiPanelOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionType, setAiQuestionType] = useState<QuestionType>('multiple-choice');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);

  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizCategory, setQuizCategory] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [quizVisibility, setQuizVisibility] = useState<QuizVisibility>('private');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Load quiz on mount
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        setError('Quiz ID not found');
        setLoading(false);
        return;
      }

      try {
        const quiz = await getCustomQuiz(quizId);
        
        if (!quiz) {
          setError('Quiz not found');
          setLoading(false);
          return;
        }

        // Check if user is the owner
        if (quiz.creatorId !== user?.uid) {
          setError('You do not have permission to edit this quiz');
          setLoading(false);
          return;
        }

        // Load quiz data
        setQuizTitle(quiz.title);
        setQuizDescription(quiz.description || '');
        setQuizCategory(quiz.category || '');
        setQuizDifficulty(quiz.difficulty || 'Beginner');
        setQuizVisibility(quiz.visibility);
        setQuestions(quiz.questions || []);
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, user?.uid]);

  const questionTemplates: QuestionTemplate[] = [
    {
      type: 'multiple-choice',
      icon: Circle,
      label: 'Multiple Choice',
      description: 'Single correct answer from multiple options',
    },
    {
      type: 'multiple-answer',
      icon: CheckSquare,
      label: 'Multiple Answers',
      description: 'Multiple correct answers can be selected',
    },
    {
      type: 'true-false',
      icon: List,
      label: 'True or False',
      description: 'Simple true/false question',
    },
    {
      type: 'fill-in-blank',
      icon: Type,
      label: 'Fill in the Blank',
      description: 'Type the correct answer',
    },
  ];

  const addQuestion = (type: QuestionType = 'multiple-choice') => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      type,
      points: 1,
      explanation: '',
    };

    if (type === 'multiple-choice') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.correctAnswer = 0;
    } else if (type === 'multiple-answer') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.correctAnswers = [];
    } else if (type === 'true-false') {
      newQuestion.correctAnswer = true;
    } else if (type === 'fill-in-blank') {
      newQuestion.correctAnswer = '';
    }

    setQuestions([...questions, newQuestion]);
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const newQuestion: QuizQuestion = {
      ...questionToDuplicate,
      id: Date.now().toString(),
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options![optionIndex] = value;
      setQuestions(newQuestions);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      setError('Please enter a quiz title');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    // Validate all questions
    const allValid = questions.every((q, idx) => {
      if (!q.question.trim()) {
        setError(`Question ${idx + 1} is empty`);
        return false;
      }
      return true;
    });

    if (!allValid) return;

    setSaving(true);
    try {
      const updatedQuiz: CustomQuiz = {
        id: quizId!,
        title: quizTitle,
        description: quizDescription,
        category: quizCategory,
        difficulty: quizDifficulty,
        visibility: quizVisibility,
        questions,
        creatorId: user?.uid || '',
        creatorName: user?.displayName || '',
        tags: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await updateCustomQuiz(quizId!, updatedQuiz);
      navigate('/my-quizzes');
    } catch (err) {
      console.error('Error saving quiz:', err);
      setError('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!aiTopic.trim()) {
      setAiError('Please enter a topic');
      return;
    }

    setAiGenerating(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      const request: QuestionGenerationRequest = {
        topic: aiTopic,
        questionType: aiQuestionType,
        numberOfQuestions: aiNumQuestions,
        difficulty: quizDifficulty,
      };

      const generatedQuestions = await generateQuestions(request);
      
      setQuestions([...questions, ...generatedQuestions]);
      setAiTopic('');
      setAiSuccess(`Generated ${generatedQuestions.length} questions successfully!`);
      
      setTimeout(() => {
        setAiSuccess(null);
        setGeminiPanelOpen(false);
      }, 3000);
    } catch (err) {
      console.error('Error generating questions:', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(233, 69, 96, 0.3)',
                borderTop: '4px solid #e94560',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            ></div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading quiz...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && loading === false) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
              Error
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => navigate('/my-quizzes')}
              style={{
                padding: '10px 24px',
                backgroundColor: '#e94560',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Back to My Quizzes
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={() => navigate('/my-quizzes')}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text)',
              fontWeight: '500',
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--color-text)' }}>
              Edit Quiz
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
              Update your quiz details and questions
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#dc2626',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#dc2626',
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Quiz Basic Info */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
            Quiz Details
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                Quiz Title
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                Description
              </label>
              <textarea
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Enter quiz description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                  Category
                </label>
                <input
                  type="text"
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value)}
                  placeholder="e.g., Science, History"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                  Difficulty
                </label>
                <select
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text)' }}>
                Visibility
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                {['private', 'shared', 'public'].map((visibility) => (
                  <button
                    key={visibility}
                    onClick={() => setQuizVisibility(visibility as QuizVisibility)}
                    style={{
                      padding: '12px',
                      backgroundColor: quizVisibility === visibility ? '#e94560' : 'var(--color-background)',
                      border: quizVisibility === visibility ? 'none' : '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: quizVisibility === visibility ? 'white' : 'var(--color-text)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {visibility === 'private' && <Lock size={16} />}
                    {visibility === 'shared' && <UsersIcon size={16} />}
                    {visibility === 'public' && <Globe size={16} />}
                    {visibility}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              Questions ({questions.length})
            </h2>
            <button
              onClick={() => setGeminiPanelOpen(!geminiPanelOpen)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                border: '1px solid rgba(79, 70, 229, 0.3)',
                borderRadius: '6px',
                color: '#4f46e5',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} />
              Generate with AI
            </button>
          </div>

          {geminiPanelOpen && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'rgba(79, 70, 229, 0.05)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
                    Topic
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Cloud Computing, JavaScript Basics"
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
                      Question Type
                    </label>
                    <select
                      value={aiQuestionType}
                      onChange={(e) => setAiQuestionType(e.target.value as QuestionType)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        color: 'var(--color-text)',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="fill-in-blank">Fill in Blank</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
                      # Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={aiNumQuestions}
                      onChange={(e) => setAiNumQuestions(parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        color: 'var(--color-text)',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>

                {aiError && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', color: '#dc2626', fontSize: '12px' }}>
                    {aiError}
                  </div>
                )}

                {aiSuccess && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', color: '#059669', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} />
                    {aiSuccess}
                  </div>
                )}

                <button
                  onClick={handleGenerateQuestions}
                  disabled={aiGenerating}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: aiGenerating ? 'not-allowed' : 'pointer',
                    opacity: aiGenerating ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {aiGenerating ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>
            </div>
          )}

          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                No questions yet. Add your first question to get started.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {questionTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.type}
                      onClick={() => addQuestion(template.type)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--color-text)',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                        e.currentTarget.style.borderColor = '#e94560';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }}
                    >
                      <Icon size={14} />
                      {template.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {questions.map((question, idx) => (
                <div key={question.id} style={{ padding: '16px', backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                        Question {idx + 1}
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                        placeholder="Enter question"
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: 'var(--color-text)',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        onClick={() => duplicateQuestion(idx)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: 'var(--color-text-secondary)',
                        }}
                        title="Duplicate question"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(idx)}
                        disabled={questions.length === 1}
                        style={{
                          padding: '6px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          cursor: questions.length === 1 ? 'not-allowed' : 'pointer',
                          color: '#dc2626',
                          opacity: questions.length === 1 ? 0.5 : 1,
                        }}
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Question type specific fields */}
                  {(question.type === 'multiple-choice' || question.type === 'multiple-answer') && question.options && (
                    <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                      {question.options.map((option, optIdx) => (
                        <input
                          key={optIdx}
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                          placeholder={`Option ${optIdx + 1}`}
                          style={{
                            padding: '8px',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            color: 'var(--color-text)',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                        Points
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={question.points || 1}
                        onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: 'var(--color-text)',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                        Explanation
                      </label>
                      <input
                        type="text"
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                        placeholder="Optional explanation"
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: 'var(--color-text)',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', paddingTop: '12px' }}>
                {questionTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.type}
                      onClick={() => addQuestion(template.type)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--color-text)',
                        fontWeight: '500',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#e94560';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }}
                      title={template.description}
                    >
                      <Icon size={12} />
                      {template.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <button
            onClick={() => navigate('/my-quizzes')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e94560',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};
