import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { QuizViolationNotification } from '../components/QuizViolationNotification';
import { useQuizProtection } from '../hooks/useQuizProtection';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { getCustomQuiz, saveQuizResult } from '../services/quizService';
import type { CustomQuiz } from '../services/quizService';
import '../styles/DashboardPage.css';

export const TakeCustomQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const [quiz, setQuiz] = useState<CustomQuiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number | number[] | boolean | string }>({});
  const [showExplanation, setShowExplanation] = useState<{ [key: number]: boolean }>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSavingResults, setIsSavingResults] = useState(false);

  const { state: protectionState, showNotification, requestFullscreen, setQuizActive } = useQuizProtection(quizContainerRef, {
    maxViolations: 5,
    onViolation: (count) => {
      console.log(`Quiz violation detected: ${count}`);
    },
    onAutoSubmit: () => {
      console.log('Auto-submitting quiz due to violations');
      handleCompleteQuiz();
    },
    enabled: quizStarted && !quizCompleted,
  });

  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      setQuizActive(true);
      requestFullscreen();
    } else {
      setQuizActive(false);
    }
  }, [quizStarted, quizCompleted, requestFullscreen, setQuizActive]);

  useEffect(() => {
    if (quizId && user) {
      loadQuiz();
    }
  }, [quizId, user]);

  useEffect(() => {
    if (quizStarted && !timeStarted) {
      setTimeStarted(Date.now());
    }
  }, [quizStarted, timeStarted]);

  useEffect(() => {
    if (quizStarted && timeStarted && !quizCompleted) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - timeStarted) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quizStarted, timeStarted, quizCompleted]);

  const loadQuiz = async () => {
    if (!quizId) return;

    setLoadingQuiz(true);
    try {
      const quizData = await getCustomQuiz(quizId);
      if (!quizData) {
        alert('Quiz not found');
        navigate('/my-quizzes');
        return;
      }
      setQuiz(quizData);
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Failed to load quiz');
      navigate('/my-quizzes');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswer = (questionIndex: number, answer: number | boolean | string) => {
    const question = quiz?.questions[questionIndex];
    if (!question) return;

    if (question.type === 'multiple-answer') {
      const currentAnswers = (selectedAnswers[questionIndex] as number[]) || [];
      const answerNum = answer as number;
      const newAnswers = currentAnswers.includes(answerNum)
        ? currentAnswers.filter((a) => a !== answerNum)
        : [...currentAnswers, answerNum];

      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex]: newAnswers,
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex]: answer,
      });
    }
  };

  const checkAnswer = (questionIndex: number) => {
    const question = quiz?.questions[questionIndex];
    if (!question) return;

    const userAnswer = selectedAnswers[questionIndex];

    if (userAnswer === undefined || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      return;
    }

    setShowExplanation({
      ...showExplanation,
      [questionIndex]: true,
    });
  };

  const checkAnswerSilent = (questionIndex: number): boolean => {
    const question = quiz?.questions[questionIndex];
    if (!question) return false;

    const userAnswer = selectedAnswers[questionIndex];

    if (userAnswer === undefined) return false;

    if (question.type === 'multiple-answer') {
      const sortedUser = [...(userAnswer as number[])].sort();
      const sortedCorrect = [...(question.correctAnswers || [])].sort();
      return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    } else if (question.type === 'true-false') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'fill-in-blank') {
      const userStr = (userAnswer as string).trim().toLowerCase();
      const correctStr = (question.correctAnswer as string).trim().toLowerCase();
      return userStr === correctStr;
    } else {
      return userAnswer === question.correctAnswer;
    }
  };

  const handleCompleteQuiz = async () => {
    if (!quiz || !user) return;

    setQuizCompleted(true);

    setIsSavingResults(true);
    try {
      const detailedAnswers = quiz.questions.map((question, index) => {
        const userAnswer = selectedAnswers[index];
        const isCorrect = checkAnswerSilent(index);

        let userAnswerStr = 'Not answered';
        let correctAnswerStr: string | string[] = 'N/A';

        if (userAnswer !== undefined) {
          if (typeof userAnswer === 'number') {
            userAnswerStr = question.options?.[userAnswer] || `Option ${userAnswer}`;
          } else if (typeof userAnswer === 'boolean') {
            userAnswerStr = userAnswer.toString();
          } else if (Array.isArray(userAnswer)) {
            userAnswerStr = userAnswer.map((idx) => question.options?.[idx] || `Option ${idx}`).join(', ');
          } else {
            userAnswerStr = userAnswer as string;
          }
        }

        if (question.correctAnswer !== undefined) {
          if (typeof question.correctAnswer === 'number') {
            correctAnswerStr = question.options?.[question.correctAnswer] || `Option ${question.correctAnswer}`;
          } else {
            correctAnswerStr = question.correctAnswer.toString();
          }
        } else if (question.correctAnswers) {
          correctAnswerStr = question.correctAnswers.map((idx) => question.options?.[idx] || `Option ${idx}`);
        }

        return {
          questionId: index,
          question: question.question,
          userAnswer: userAnswerStr,
          correctAnswer: correctAnswerStr,
          isCorrect: isCorrect,
          points: isCorrect ? question.points : 0,
        };
      });

      const totalScore = detailedAnswers.reduce((sum, ans) => sum + ans.points, 0);
      const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

      await saveQuizResult(user.uid, quiz.id || 'custom', quiz.title, totalScore, maxScore, detailedAnswers, timeSpent);
    } catch (error) {
      console.error('Error saving quiz results:', error);
    } finally {
      setIsSavingResults(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentScore = quiz
    ? Object.keys(showExplanation).reduce((acc, key) => {
        return acc + (checkAnswerSilent(parseInt(key)) ? quiz.questions[parseInt(key)].points : 0);
      }, 0)
    : 0;
  const maxScore = quiz ? quiz.questions.reduce((sum, q) => sum + q.points, 0) : 0;

  if (loading || loadingQuiz) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(233, 69, 96, 0.3)',
              borderTop: '3px solid #e94560',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px',
            }}
          ></div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading Quiz...</p>
        </div>
      </div>
    );
  }

  if (!user || !quiz) {
    navigate('/my-quizzes');
    return null;
  }

  return (
    <AppLayout hideNavigation={protectionState.isQuizActive}>
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <main className="main-content">
          {!quizStarted ? (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(22, 33, 62, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '50px 40px',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}
              >
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
                  {quiz.title}
                </h1>
                <p
                  style={{
                    fontSize: '16px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '40px',
                    lineHeight: '1.6',
                    maxWidth: '600px',
                    margin: '0 auto 40px',
                  }}
                >
                  {quiz.description || 'Test your knowledge with this custom quiz.'}
                </p>

                <div
                  style={{
                    backgroundColor: 'rgba(233, 69, 96, 0.1)',
                    border: '1px solid rgba(233, 69, 96, 0.2)',
                    padding: '24px',
                    borderRadius: '8px',
                    marginBottom: '40px',
                    textAlign: 'left',
                  }}
                >
                  <h3 style={{ marginBottom: '16px', color: 'var(--color-accent-light)', fontSize: '16px', fontWeight: '600' }}>
                    Quiz Details
                  </h3>
                  <ul style={{ color: 'var(--color-text-secondary)', lineHeight: '2', listStyle: 'none', padding: 0 }}>
                    <li>
                      ✓ <strong>{quiz.questions.length} Questions</strong>
                    </li>
                    <li>
                      ✓ <strong>Created by:</strong> {quiz.creatorName}
                    </li>
                    {quiz.difficulty && (
                      <li>
                        ✓ <strong>Difficulty:</strong> {quiz.difficulty}
                      </li>
                    )}
                    {quiz.category && (
                      <li>
                        ✓ <strong>Category:</strong> {quiz.category}
                      </li>
                    )}
                    <li>✓ <strong>Instant Feedback</strong> - Detailed explanations for each answer</li>
                  </ul>
                </div>

                <button
                  onClick={() => setQuizStarted(true)}
                  style={{
                    padding: '12px 48px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: 'var(--color-accent-light)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    boxShadow: '0 4px 12px rgba(233, 69, 96, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d63948';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-light)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Start Quiz
                </button>
              </div>
            </div>
          ) : !quizCompleted ? (
            <div ref={quizContainerRef} style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px' }}>
              <QuizViolationNotification
                show={showNotification}
                message={protectionState.warningMessage}
                violations={protectionState.violations}
                maxViolations={5}
              />
              <div
                style={{
                  backgroundColor: 'rgba(22, 33, 62, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '24px',
                  borderRadius: '12px',
                  marginBottom: '30px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Question {currentQuestion + 1} of {quiz.questions.length}
                    </span>
                    <div style={{ width: '280px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-accent-light)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                    <div
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgba(14, 52, 96, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#6ba3ff',
                        fontWeight: '600',
                      }}
                    >
                      <Clock size={14} style={{ marginRight: '6px', display: 'inline' }} /> {formatTime(timeSpent)}
                    </div>
                    <div
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        color: '#10b981',
                        fontWeight: '600',
                      }}
                    >
                      {Object.keys(showExplanation).length > 0 ? currentScore : '—'} / {maxScore}
                    </div>
                  </div>
                </div>
              </div>

              {quiz.questions[currentQuestion] && (
                <div
                  style={{
                    backgroundColor: 'rgba(22, 33, 62, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '32px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px', lineHeight: '1.5' }}>
                      {quiz.questions[currentQuestion].question}
                    </h2>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        backgroundColor: 'rgba(233, 69, 96, 0.15)',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        border: '1px solid rgba(233, 69, 96, 0.2)',
                      }}
                    >
                      {quiz.questions[currentQuestion].type === 'multiple-answer' && '(Select all that apply)'}
                      {quiz.questions[currentQuestion].type === 'true-false' && '(True or False)'}
                      {quiz.questions[currentQuestion].type === 'multiple-choice' && '(Single choice)'}
                      {quiz.questions[currentQuestion].type === 'fill-in-blank' && '(Type your answer)'}
                    </span>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    {quiz.questions[currentQuestion].type === 'true-false' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[true, false].map((option) => {
                          const isSelected = selectedAnswers[currentQuestion] === option;
                          const isAnswered = showExplanation[currentQuestion];
                          const isCorrect = isAnswered ? checkAnswerSilent(currentQuestion) : null;

                          return (
                            <label
                              key={option.toString()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px',
                                border: isSelected
                                  ? isAnswered
                                    ? isCorrect
                                      ? '2px solid #10b981'
                                      : '2px solid #ef4444'
                                    : '2px solid var(--color-accent-light)'
                                  : '2px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                cursor: isAnswered ? 'default' : 'pointer',
                                backgroundColor: isSelected
                                  ? isAnswered
                                    ? isCorrect
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(233, 69, 96, 0.1)'
                                  : isAnswered && option === quiz.questions[currentQuestion].correctAnswer
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : 'rgba(255, 255, 255, 0.05)',
                                transition: 'var(--transition-smooth)',
                              }}
                            >
                              <input
                                type="radio"
                                checked={isSelected}
                                onChange={() => !isAnswered && handleAnswer(currentQuestion, option)}
                                disabled={isAnswered}
                                style={{ marginRight: '12px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                                {option ? 'True' : 'False'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : quiz.questions[currentQuestion].type === 'fill-in-blank' ? (
                      <input
                        type="text"
                        value={(selectedAnswers[currentQuestion] as string) || ''}
                        onChange={(e) => !showExplanation[currentQuestion] && handleAnswer(currentQuestion, e.target.value)}
                        disabled={showExplanation[currentQuestion]}
                        placeholder="Type your answer here..."
                        style={{
                          width: '100%',
                          padding: '16px',
                          backgroundColor: 'var(--color-background)',
                          border: '2px solid var(--color-border)',
                          borderRadius: '8px',
                          color: 'var(--color-text)',
                          fontSize: '16px',
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {quiz.questions[currentQuestion].options?.map((option, optionIdx) => {
                          const isSelected =
                            quiz.questions[currentQuestion].type === 'multiple-answer'
                              ? (selectedAnswers[currentQuestion] as number[])?.includes(optionIdx)
                              : selectedAnswers[currentQuestion] === optionIdx;
                          const isAnswered = showExplanation[currentQuestion];
                          const isCorrectOption =
                            quiz.questions[currentQuestion].type === 'multiple-answer'
                              ? (quiz.questions[currentQuestion].correctAnswers || []).includes(optionIdx)
                              : optionIdx === quiz.questions[currentQuestion].correctAnswer;

                          return (
                            <label
                              key={optionIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                padding: '16px',
                                border: isSelected
                                  ? isAnswered
                                    ? isCorrectOption
                                      ? '2px solid #10b981'
                                      : '2px solid #ef4444'
                                    : '2px solid var(--color-accent-light)'
                                  : isAnswered && isCorrectOption
                                  ? '2px solid #10b981'
                                  : '2px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                cursor: isAnswered ? 'default' : 'pointer',
                                backgroundColor: isSelected
                                  ? isAnswered
                                    ? isCorrectOption
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(233, 69, 96, 0.1)'
                                  : isAnswered && isCorrectOption
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : 'rgba(255, 255, 255, 0.05)',
                                transition: 'var(--transition-smooth)',
                              }}
                            >
                              <input
                                type={quiz.questions[currentQuestion].type === 'multiple-answer' ? 'checkbox' : 'radio'}
                                checked={isSelected}
                                onChange={() => !isAnswered && handleAnswer(currentQuestion, optionIdx)}
                                disabled={isAnswered}
                                style={{ marginRight: '12px', marginTop: '2px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!showExplanation[currentQuestion] &&
                    selectedAnswers[currentQuestion] !== undefined &&
                    (quiz.questions[currentQuestion].type !== 'multiple-answer' ||
                      (selectedAnswers[currentQuestion] as number[]).length > 0) && (
                      <button
                        onClick={() => checkAnswer(currentQuestion)}
                        style={{
                          padding: '10px 28px',
                          backgroundColor: 'var(--color-accent-light)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginBottom: '20px',
                          transition: 'var(--transition-smooth)',
                          boxShadow: '0 4px 12px rgba(233, 69, 96, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#d63948';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-accent-light)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Check Answer
                      </button>
                    )}

                  {showExplanation[currentQuestion] && (
                    <div
                      style={{
                        padding: '20px',
                        backgroundColor: checkAnswerSilent(currentQuestion) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `2px solid ${checkAnswerSilent(currentQuestion) ? '#10b981' : '#ef4444'}`,
                        borderRadius: '8px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        {checkAnswerSilent(currentQuestion) ? (
                          <>
                            <CheckCircle style={{ color: '#10b981' }} size={24} />
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>Correct!</span>
                          </>
                        ) : (
                          <>
                            <XCircle style={{ color: '#ef4444' }} size={24} />
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>Incorrect</span>
                          </>
                        )}
                      </div>
                      {quiz.questions[currentQuestion].explanation && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <AlertCircle style={{ flexShrink: 0, marginTop: '4px', color: 'var(--color-text-secondary)' }} size={18} />
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                            {quiz.questions[currentQuestion].explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'space-between',
                      marginTop: '28px',
                      paddingTop: '20px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <button
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: currentQuestion === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(233, 69, 96, 0.2)',
                        color: currentQuestion === 0 ? 'var(--color-text-secondary)' : 'var(--color-accent-light)',
                        border: '1px solid ' + (currentQuestion === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(233, 69, 96, 0.3)'),
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                        transition: 'var(--transition-smooth)',
                      }}
                    >
                      ← Previous
                    </button>

                    {currentQuestion === quiz.questions.length - 1 && selectedAnswers[currentQuestion] !== undefined ? (
                      <button
                        onClick={handleCompleteQuiz}
                        disabled={isSavingResults}
                        style={{
                          padding: '10px 28px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#10b981';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {isSavingResults ? 'Saving...' : 'Complete Quiz'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                        disabled={currentQuestion === quiz.questions.length - 1}
                        style={{
                          padding: '10px 28px',
                          backgroundColor: currentQuestion === quiz.questions.length - 1 ? 'rgba(255, 255, 255, 0.05)' : 'var(--color-accent-light)',
                          color: currentQuestion === quiz.questions.length - 1 ? 'var(--color-text-secondary)' : 'white',
                          border: currentQuestion === quiz.questions.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: currentQuestion === quiz.questions.length - 1 ? 'not-allowed' : 'pointer',
                          transition: 'var(--transition-smooth)',
                          boxShadow: currentQuestion === quiz.questions.length - 1 ? 'none' : '0 4px 12px rgba(233, 69, 96, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          if (currentQuestion < quiz.questions.length - 1) {
                            e.currentTarget.style.backgroundColor = '#d63948';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentQuestion < quiz.questions.length - 1) {
                            e.currentTarget.style.backgroundColor = 'var(--color-accent-light)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(22, 33, 62, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '50px 40px',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '2px solid #10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 30px',
                  }}
                >
                  <CheckCircle size={48} style={{ color: '#10b981' }} />
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '20px' }}>Quiz Complete!</h2>
                <div style={{ fontSize: '56px', fontWeight: 'bold', color: 'var(--color-accent-light)', marginBottom: '10px' }}>
                  {quiz ? quiz.questions.reduce((sum, q, idx) => sum + (checkAnswerSilent(idx) ? q.points : 0), 0) : 0} / {maxScore}
                </div>
                <p style={{ fontSize: '20px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                  ({quiz ? (((quiz.questions.reduce((sum, q, idx) => sum + (checkAnswerSilent(idx) ? q.points : 0), 0) / maxScore) * 100)).toFixed(1) : '0'}%)
                </p>
                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Clock size={16} /> Time spent: {formatTime(timeSpent)}
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => navigate('/my-quizzes')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'rgba(233, 69, 96, 0.2)',
                      border: '1px solid rgba(233, 69, 96, 0.3)',
                      borderRadius: '8px',
                      color: 'var(--color-accent-light)',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Back to Quizzes
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--color-accent-light)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Retake Quiz
                  </button>
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
    </AppLayout>
  );
};
