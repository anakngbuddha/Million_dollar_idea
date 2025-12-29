import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  HelpCircle,
  GripVertical,
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
import { createCustomQuiz } from '../services/quizService';
import type {
  QuizQuestion,
  QuestionType,
  QuizVisibility,
} from '../services/quizService';
import { generateQuestions } from '../services/geminiService';
import type { QuestionGenerationRequest } from '../services/geminiService';
import '../styles/DashboardPage.css';
import '../styles/GeminiPanel.css';

interface QuestionTemplate {
  type: QuestionType;
  icon: React.ElementType;
  label: string;
  description: string;
}

export const CreateQuizPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showTemplateHelp, setShowTemplateHelp] = useState(false);
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
  const [attemptRestriction, setAttemptRestriction] = useState<'unlimited' | 'once' | 'limited'>('unlimited');
  const [attemptLimit, setAttemptLimit] = useState(3);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: '1',
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1,
    },
  ]);

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

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options!.push('');
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options && newQuestions[questionIndex].options!.length > 2) {
      newQuestions[questionIndex].options!.splice(optionIndex, 1);
      setQuestions(newQuestions);
    }
  };

  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if (question.type === 'multiple-choice') {
      question.correctAnswer = optionIndex;
    } else if (question.type === 'multiple-answer') {
      const correctAnswers = question.correctAnswers || [];
      if (correctAnswers.includes(optionIndex)) {
        question.correctAnswers = correctAnswers.filter(i => i !== optionIndex);
      } else {
        question.correctAnswers = [...correctAnswers, optionIndex];
      }
    }

    setQuestions(newQuestions);
  };

  const handleSaveQuiz = async () => {
    if (!user) return;

    if (!quizTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    if (questions.some(q => !q.question.trim())) {
      alert('Please fill in all question texts');
      return;
    }

    setSaving(true);
    try {
      await createCustomQuiz({
        title: quizTitle,
        description: quizDescription,
        creatorId: user.uid,
        creatorName: user.displayName || user.email || 'Anonymous',
        questions,
        visibility: quizVisibility,
        category: quizCategory || undefined,
        difficulty: quizDifficulty,
        attemptRestriction,
        attemptLimit: attemptRestriction === 'limited' ? attemptLimit : undefined,
      });

      alert('Quiz created successfully!');
      navigate(`/my-quizzes`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityIcon = (visibility: QuizVisibility) => {
    switch (visibility) {
      case 'public':
        return Globe;
      case 'private':
        return Lock;
      case 'shared':
        return UsersIcon;
      case 'classroom':
        return UsersIcon;
      default:
        return Lock;
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) {
      setAiError('Please enter a topic for question generation');
      return;
    }

    setAiError(null);
    setAiSuccess(null);
    setAiGenerating(true);

    try {
      const request: QuestionGenerationRequest = {
        topic: aiTopic,
        difficulty: quizDifficulty,
        questionType: aiQuestionType,
        numberOfQuestions: aiNumQuestions,
      };

      const generatedQuestions = await generateQuestions(request);
      
      // Add generated questions to the existing questions
      setQuestions([...questions, ...generatedQuestions]);
      
      setAiSuccess(`Successfully generated ${generatedQuestions.length} questions!`);
      setAiTopic('');
      
      // Auto-close panel after 2 seconds
      setTimeout(() => {
        setGeminiPanelOpen(false);
        setAiSuccess(null);
      }, 2000);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="dashboard-container" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="dashboard-layout">
          <main className="main-content" style={{ backgroundColor: 'var(--color-background)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/my-quizzes')}
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>Create Quiz</h1>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowTemplateHelp(!showTemplateHelp)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(66, 133, 244, 0.1)',
                  border: '1px solid rgba(66, 133, 244, 0.3)',
                  borderRadius: '6px',
                  color: '#4285F4',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <HelpCircle size={16} />
                Question Templates
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={saving}
                style={{
                  padding: '8px 20px',
                  backgroundColor: saving ? '#6b7280' : '#10b981',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
          </div>

          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        {showTemplateHelp && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>
              Question Type Templates
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {questionTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.type}
                    onClick={() => addQuestion(template.type)}
                    style={{
                      padding: '16px',
                      backgroundColor: 'rgba(233, 69, 96, 0.05)',
                      border: '1px solid rgba(233, 69, 96, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Icon size={24} style={{ color: '#e94560', marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text)' }}>
                      {template.label}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {template.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-text)' }}>
            Quiz Information
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
              Quiz Title *
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title..."
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text)',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
              Description
            </label>
            <textarea
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Describe what this quiz covers..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text)',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                Category
              </label>
              <input
                type="text"
                value={quizCategory}
                onChange={(e) => setQuizCategory(e.target.value)}
                placeholder="e.g., Cloud Computing"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
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
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  appearance: 'auto',
                  WebkitAppearance: 'menulist',
                  MozAppearance: 'menulist',
                }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
              Visibility
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {(['private', 'public', 'shared', 'classroom'] as QuizVisibility[]).map((visibility) => {
                const Icon = getVisibilityIcon(visibility);
                return (
                  <button
                    key={visibility}
                    onClick={() => setQuizVisibility(visibility)}
                    style={{
                      flex: visibility === 'classroom' ? '1 0 100%' : '1 0 auto',
                      minWidth: '100px',
                      padding: '12px',
                      backgroundColor: quizVisibility === visibility ? 'rgba(233, 69, 96, 0.1)' : 'var(--color-background)',
                      border: `2px solid ${quizVisibility === visibility ? '#e94560' : 'var(--color-border)'}`,
                      borderRadius: '6px',
                      color: quizVisibility === visibility ? '#e94560' : 'var(--color-text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={16} />
                    {visibility === 'classroom' ? 'Classroom Shareable' : visibility}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {quizVisibility === 'private' && '• Only you can see this quiz'}
              {quizVisibility === 'public' && '• Anyone can view and take this quiz'}
              {quizVisibility === 'shared' && '• Share with specific users (configure later)'}
              {quizVisibility === 'classroom' && '• Share with specific classrooms where you are the instructor'}
            </p>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text)' }}>
              Attempt Restrictions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                  Students can take this quiz:
                </label>
                <select
                  value={attemptRestriction}
                  onChange={(e) => setAttemptRestriction(e.target.value as 'unlimited' | 'once' | 'limited')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="unlimited">Unlimited times</option>
                  <option value="once">Once only</option>
                  <option value="limited">Limited number of times</option>
                </select>
              </div>

              {attemptRestriction === 'limited' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                    Number of attempts allowed:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={attemptLimit}
                    onChange={(e) => setAttemptLimit(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {questions.map((question, questionIndex) => (
          <div
            key={question.id}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <GripVertical size={20} style={{ color: 'var(--color-text-secondary)', cursor: 'grab' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                Question {questionIndex + 1}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => duplicateQuestion(questionIndex)}
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                  title="Duplicate question"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => deleteQuestion(questionIndex)}
                  disabled={questions.length === 1}
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: questions.length === 1 ? 'var(--color-text-secondary)' : '#ef4444',
                    cursor: questions.length === 1 ? 'not-allowed' : 'pointer',
                    opacity: questions.length === 1 ? 0.5 : 1,
                  }}
                  title="Delete question"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                Question Type
              </label>
              <select
                value={question.type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  const updates: Partial<QuizQuestion> = { type: newType };

                  if (newType === 'multiple-choice') {
                    updates.options = ['', '', '', ''];
                    updates.correctAnswer = 0;
                    updates.correctAnswers = undefined;
                  } else if (newType === 'multiple-answer') {
                    updates.options = ['', '', '', ''];
                    updates.correctAnswers = [];
                    updates.correctAnswer = undefined;
                  } else if (newType === 'true-false') {
                    updates.options = undefined;
                    updates.correctAnswer = true;
                    updates.correctAnswers = undefined;
                  } else if (newType === 'fill-in-blank') {
                    updates.options = undefined;
                    updates.correctAnswer = '';
                    updates.correctAnswers = undefined;
                  }

                  updateQuestion(questionIndex, updates);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  appearance: 'auto',
                  WebkitAppearance: 'menulist',
                  MozAppearance: 'menulist',
                }}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="multiple-answer">Multiple Answers</option>
                <option value="true-false">True or False</option>
                <option value="fill-in-blank">Fill in the Blank</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                Question Text *
              </label>
              <textarea
                value={question.question}
                onChange={(e) => updateQuestion(questionIndex, { question: e.target.value })}
                placeholder="Enter your question..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            {question.type === 'true-false' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                  Correct Answer
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[true, false].map((value) => (
                    <button
                      key={value.toString()}
                      onClick={() => updateQuestion(questionIndex, { correctAnswer: value })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: question.correctAnswer === value ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background)',
                        border: `2px solid ${question.correctAnswer === value ? '#10b981' : 'var(--color-border)'}`,
                        borderRadius: '6px',
                        color: question.correctAnswer === value ? '#10b981' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {value ? 'True' : 'False'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {question.type === 'fill-in-blank' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={question.correctAnswer as string || ''}
                  onChange={(e) => updateQuestion(questionIndex, { correctAnswer: e.target.value })}
                  placeholder="Enter the correct answer..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}

            {(question.type === 'multiple-choice' || question.type === 'multiple-answer') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                  Options {question.type === 'multiple-answer' && '(Select all correct answers)'}
                </label>
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type={question.type === 'multiple-choice' ? 'radio' : 'checkbox'}
                      checked={
                        question.type === 'multiple-choice'
                          ? question.correctAnswer === optionIndex
                          : (question.correctAnswers || []).includes(optionIndex)
                      }
                      onChange={() => toggleCorrectAnswer(questionIndex, optionIndex)}
                      style={{ cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                      }}
                    />
                    {question.options && question.options.length > 2 && (
                      <button
                        onClick={() => removeOption(questionIndex, optionIndex)}
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addOption(questionIndex)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                  }}
                >
                  <Plus size={16} />
                  Add Option
                </button>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                Explanation (Optional)
              </label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(questionIndex, { explanation: e.target.value })}
                placeholder="Explain the correct answer..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                Points
              </label>
              <input
                type="number"
                min="1"
                value={question.points}
                onChange={(e) => updateQuestion(questionIndex, { points: parseInt(e.target.value) || 1 })}
                style={{
                  width: '100px',
                  padding: '10px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        ))}

        <button
          onClick={() => addQuestion()}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'var(--color-surface)',
            border: '2px dashed var(--color-border)',
            borderRadius: '12px',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.05)';
            e.currentTarget.style.borderColor = '#e94560';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          <Plus size={20} />
          Add Question
        </button>
          </div>

          {/* Gemini AI Panel */}
          <div className={`gemini-panel-container ${!geminiPanelOpen ? 'closed' : ''}`}>
            <div className="gemini-panel-header">
              <div className="gemini-panel-title">
                <Sparkles size={20} className="gemini-icon" />
                AI Question Generator
              </div>
              <button className="gemini-close-btn" onClick={() => setGeminiPanelOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="gemini-panel-content">
              <div className="gemini-info-box">
                <Sparkles size={16} />
                Generate quiz questions automatically using Google Gemini AI. Just describe your topic!
              </div>

              {aiError && (
                <div className="gemini-error">
                  <AlertCircle size={16} />
                  {aiError}
                </div>
              )}

              {aiSuccess && (
                <div className="gemini-success">
                  <CheckCircle2 size={16} />
                  {aiSuccess}
                </div>
              )}

              <div className="gemini-form-group">
                <label>Topic / Subject</label>
                <textarea
                  className="gemini-textarea"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="E.g., 'JavaScript arrays and methods' or 'World War II history'"
                  disabled={aiGenerating}
                />
              </div>

              <div className="gemini-form-group">
                <label>Question Type</label>
                <select
                  className="gemini-select"
                  value={aiQuestionType}
                  onChange={(e) => setAiQuestionType(e.target.value as QuestionType)}
                  disabled={aiGenerating}
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="multiple-answer">Multiple Answer</option>
                  <option value="true-false">True/False</option>
                  <option value="fill-in-blank">Fill in the Blank</option>
                </select>
              </div>

              <div className="gemini-form-group">
                <label>Number of Questions</label>
                <input
                  type="number"
                  className="gemini-input"
                  min="1"
                  max="10"
                  value={aiNumQuestions}
                  onChange={(e) => setAiNumQuestions(parseInt(e.target.value) || 1)}
                  disabled={aiGenerating}
                />
                <div className="gemini-question-count">
                  <AlertCircle size={14} />
                  Difficulty will match your quiz setting: {quizDifficulty}
                </div>
              </div>

              <button
                className="gemini-generate-btn"
                onClick={handleGenerateWithAI}
                disabled={aiGenerating || !aiTopic.trim()}
              >
                {aiGenerating ? (
                  <>
                    <div className="gemini-spinner" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Questions
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Gemini AI Toggle Button */}
          <button
            className="gemini-toggle-btn"
            onClick={() => setGeminiPanelOpen(!geminiPanelOpen)}
            title="AI Question Generator"
          >
            <Sparkles size={24} className="gemini-icon" />
          </button>
        </main>
        </div>
      </div>
    </AppLayout>
  );
};
