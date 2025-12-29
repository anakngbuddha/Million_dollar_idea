import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { QuizViolationNotification } from '../../components/QuizViolationNotification';
import { useQuizProtection } from '../../hooks/useQuizProtection';
import { saveQuizResult } from '../../services/quizService';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users} from 'lucide-react';
import '../../styles/DashboardPage.css';

interface Question {
  id: number;
  type: 'true-false' | 'multiple-choice' | 'multiple-answer';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  userAnswer?: string | string[];
}

export const StorageMigrationQuiz: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | string[])[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const questions: Question[] = [
    {
      id: 1,
      type: 'true-false',
      question: 'ECS local disk is persistent even if the instance is deleted.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      points: 1},
    {
      id: 2,
      type: 'true-false',
      question: 'OBS can be used as live storage for a database.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      points: 1},
    {
      id: 3,
      type: 'true-false',
      question: 'EVS must be mounted before a database can write data to it.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1},
    {
      id: 4,
      type: 'true-false',
      question: 'SMS automatically migrates attached EVS volumes when migrating an ECS instance.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1},
    {
      id: 5,
      type: 'true-false',
      question: 'Data Express Service (DES) can migrate data to both EVS and OBS.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1},
    {
      id: 6,
      type: 'true-false',
      question: 'You can use Huawei EVS snapshots to migrate data from AWS to Huawei Cloud.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      points: 1},
    {
      id: 7,
      type: 'true-false',
      question: 'VPN can provide a secure connection between AWS EC2 and Huawei ECS for migration.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1},
    {
      id: 8,
      type: 'true-false',
      question: 'DES is recommended for migrating small datasets under 100 GB.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      points: 1},
    {
      id: 9,
      type: 'true-false',
      question: 'Database dumps are commonly used when migrating database data across clouds.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1},
    {
      id: 10,
      type: 'true-false',
      question: 'OBS objects are stored as files with metadata and a flat namespace.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1},
    {
      id: 11,
      type: 'multiple-choice',
      question: 'Which of the following storage types is persistent and block-based?',
      options: ['ECS local disk', 'OBS', 'EVS', 'Both a and c'],
      correctAnswer: 'EVS',
      points: 2},
    {
      id: 12,
      type: 'multiple-choice',
      question: 'Which Huawei Cloud tool is recommended for migrating large datasets (>1 TB) quickly?',
      options: ['SMS', 'DES', 'OBS', 'EVS snapshot'],
      correctAnswer: 'DES',
      points: 2},
    {
      id: 13,
      type: 'multiple-choice',
      question: 'If you attach EVS to ECS but do not mount it, where will the database store data by default?',
      options: ['EVS', 'ECS local disk', 'OBS', 'Cannot store data'],
      correctAnswer: 'ECS local disk',
      points: 2},
    {
      id: 14,
      type: 'multiple-choice',
      question: 'When using a VPN to migrate from AWS to Huawei, which of the following must be configured?',
      options: ['VPN Gateway on Huawei Cloud', 'Customer Gateway on AWS', 'Route tables and security groups', 'All of the above'],
      correctAnswer: 'All of the above',
      points: 2},
    {
      id: 15,
      type: 'multiple-choice',
      question: 'Which file type is commonly used for database backups before migration?',
      options: ['.sql', '.bak', '.dump', 'All of the above'],
      correctAnswer: 'All of the above',
      points: 2},
    {
      id: 16,
      type: 'multiple-choice',
      question: 'What is a key advantage of using DES over direct Internet transfer?',
      options: ['Lower cost', 'Faster and more reliable for large data', 'Automatic database restoration', 'Can migrate live ECS instances without preparation'],
      correctAnswer: 'Faster and more reliable for large data',
      points: 2},
    {
      id: 17,
      type: 'multiple-choice',
      question: 'If you want to migrate data to OBS, what is required?',
      options: ['Mount EVS', 'Upload files via OBS CLI or SDK', 'Attach system disk', 'Use EVS snapshot'],
      correctAnswer: 'Upload files via OBS CLI or SDK',
      points: 2},
    {
      id: 18,
      type: 'multiple-choice',
      question: 'Which is NOT a valid use case for OBS?',
      options: ['Backup storage', 'Database live storage', 'Archive of files', 'Static web content'],
      correctAnswer: 'Database live storage',
      points: 2},
    {
      id: 19,
      type: 'multiple-choice',
      question: 'When migrating ECS with SMS from another cloud, which storage is migrated automatically?',
      options: ['EVS', 'ECS system disk', 'OBS', 'All attached disks'],
      correctAnswer: 'All attached disks',
      points: 2},
    {
      id: 20,
      type: 'multiple-choice',
      question: 'To migrate database data safely across clouds, you should:',
      options: ['Transfer the database files directly from live DB', 'Stop the database, export a dump, and transfer', 'Only copy the local disk without export', 'Use EVS snapshot from AWS'],
      correctAnswer: 'Stop the database, export a dump, and transfer',
      points: 2},
  ];

  // Track quiz start time when quiz begins
  useEffect(() => {
    if (quizStarted && !timeStarted) {
      setTimeStarted(Date.now());
    }
  }, [quizStarted, timeStarted]);


  const handleAnswer = (answer: string | string[]) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);
  };

  const handleCompleteQuiz = () => {
    calculateScore();
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = async () => {
    let totalScore = 0;
    const answerDetails = questions.map((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = question.correctAnswer === userAnswer;
      if (isCorrect) {
        totalScore += question.points;
      }
      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer || '',
        correctAnswer: question.correctAnswer || '',
        isCorrect,
        points: question.points};
    });

    setScore(totalScore);
    setQuizCompleted(true);

    // Calculate time spent
    if (timeStarted) {
      const spent = Math.floor((Date.now() - timeStarted) / 1000);
      setTimeSpent(spent);
    }

    // Save to Firebase if user is authenticated
    if (user && user.uid) {
      setIsSavingResults(true);
      setSaveError(null);
      try {
        await saveQuizResult(
          user.uid,
          'storage-migration',
          'Huawei Cloud Storage Migration',
          totalScore,
          30,
          answerDetails,
          timeStarted ? Math.floor((Date.now() - timeStarted) / 1000) : 0
        );
        console.log('Quiz results saved successfully');
      } catch (error) {
        console.error('Error saving quiz results:', error);
        setSaveError('Failed to save quiz results. Your score was not recorded.');
      } finally {
        setIsSavingResults(false);
      }
    }
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setScore(0);
    setTimeStarted(null);
    setTimeSpent(0);
    setSaveError(null);
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
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading Quiz...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const maxScore = totalPoints;

  return (
    <AppLayout hideNavigation={protectionState.isQuizActive}>
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <main className="main-content">
          {!quizStarted ? (
            <>
              {/* Quiz Intro */}
              <div className="content-header">
                <h1>Huawei Cloud Migration Quiz</h1>
                <p>Master the concepts of ECS, EVS, OBS, SMS, DES, and cross-cloud VPN migration.</p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '40px',
                maxWidth: '600px'}}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '32px'}}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'rgba(233, 69, 96, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #e94560'}}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Total Questions
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#e94560' }}>
                      {questions.length}
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'}}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Max Points
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                      {maxScore}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '32px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)'}}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} />
                    <span>Average Time: 20-25 min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} />
                    <span>Difficulty: Intermediate</span>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(96, 165, 250, 0.05)',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '32px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)'}}>
                  <strong style={{ color: 'var(--color-text)' }}>Instructions:</strong>
                  <ul style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
                    <li>Answer all questions to complete the quiz</li>
                    <li>You can navigate between questions</li>
                    <li>Check your answers before final submission</li>
                    <li>Your score will be calculated automatically</li>
                  </ul>
                </div>

                <button
                  onClick={() => setQuizStarted(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#e94560',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.backgroundColor = '#d83a50';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#e94560';
                  }}
                >
                  Start Quiz
                </button>
              </div>
            </>
          ) : !quizCompleted ? (
            <>
              <QuizViolationNotification
                show={showNotification}
                message={protectionState.warningMessage}
                violations={protectionState.violations}
                maxViolations={5}
              />
              <div ref={quizContainerRef} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'}}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
                    Question {currentQuestion + 1} of {questions.length}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {questions[currentQuestion].type === 'true-false' ? 'True/False' : questions[currentQuestion].type === 'multiple-choice' ? 'Single Choice' : 'Multiple Answer'} • {questions[currentQuestion].points} {questions[currentQuestion].points === 1 ? 'point' : 'points'}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'}}>
                  <div style={{
                    width: '120px',
                    height: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'}}>
                    <div style={{
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                      height: '100%',
                      backgroundColor: '#e94560',
                      transition: 'width 0.3s ease'}}></div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <div style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '32px',
                marginBottom: '32px'}}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  color: 'var(--color-text)',
                  lineHeight: '1.6'}}>
                  {questions[currentQuestion].question}
                </h3>

                {/* Answer Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {questions[currentQuestion].options?.map((option, index) => (
                    <label
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: userAnswers[currentQuestion] === option
                          ? '#e94560'
                          : 'var(--color-border)',
                        backgroundColor: userAnswers[currentQuestion] === option
                          ? 'rgba(233, 69, 96, 0.1)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'}}
                      onMouseEnter={(e) => {
                        if (userAnswers[currentQuestion] !== option) {
                          e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.5)';
                          e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (userAnswers[currentQuestion] !== option) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="answer"
                        checked={userAnswers[currentQuestion] === option}
                        onChange={() => handleAnswer(option)}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          marginRight: '12px'}}
                      />
                      <span style={{ fontSize: '15px' }}>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'space-between'}}>
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: currentQuestion === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    color: 'var(--color-text)',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentQuestion === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease'}}
                  onMouseEnter={(e) => {
                    if (currentQuestion > 0) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ← Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={!userAnswers[currentQuestion]}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: !userAnswers[currentQuestion] ? 'rgba(233, 69, 96, 0.5)' : '#e94560',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: !userAnswers[currentQuestion] ? 'not-allowed' : 'pointer',
                    opacity: !userAnswers[currentQuestion] ? 0.6 : 1,
                    transition: 'all 0.2s ease'}}
                  onMouseEnter={(e) => {
                    if (userAnswers[currentQuestion]) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.backgroundColor = '#d83a50';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#e94560';
                  }}
                >
                  {currentQuestion === questions.length - 1 ? 'Submit Quiz' : 'Next →'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Results Screen */}
              <div className="content-header">
                <h1>Quiz Complete!</h1>
                <p>Here's how you performed on the Huawei Cloud Migration Quiz.</p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center'}}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 24px',
                  borderRadius: '50%',
                  backgroundColor: score >= maxScore * 0.7 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: '700',
                  color: score >= maxScore * 0.7 ? '#10b981' : '#f59e0b'}}>
                  {score}/{maxScore}
                </div>

                <h2 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>
                  {score >= maxScore * 0.9 ? '🎉 Excellent!' : score >= maxScore * 0.7 ? '✓ Great Job!' : 'Keep Learning!'}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  You scored {score} out of {maxScore} points ({Math.round((score / maxScore) * 100)}%)
                </p>
                {timeSpent > 0 && (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '24px' }}>
                    Time spent: {Math.floor(timeSpent / 60)} min {timeSpent % 60} sec
                  </p>
                )}

                {isSavingResults && (
                  <div style={{
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '24px',
                    fontSize: '13px',
                    color: 'rgba(96, 165, 250, 0.9)'}}>
                    Saving your results to Firebase...
                  </div>
                )}

                {saveError && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '24px',
                    fontSize: '13px',
                    color: 'rgba(239, 68, 68, 0.9)'}}>
                    ⚠️ {saveError}
                  </div>
                )}

                {!isSavingResults && !saveError && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '24px',
                    fontSize: '13px',
                    color: 'rgba(16, 185, 129, 0.9)'}}>
                    ✓ Results saved successfully
                  </div>
                )}

                {/* Score Breakdown */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '32px',
                  textAlign: 'left'}}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-text)' }}>
                    Answer Review
                  </h3>
                  <div style={{
                    display: 'grid',
                    gap: '12px',
                    maxHeight: '300px',
                    overflowY: 'auto'}}>
                    {questions.map((question, index) => {
                      const isCorrect = question.correctAnswer === userAnswers[index];
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '6px',
                            backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderLeft: `3px solid ${isCorrect ? '#10b981' : '#ef4444'}`}}>
                          {isCorrect ? (
                            <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                          ) : (
                            <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                          )}
                          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            Q{index + 1}: {isCorrect ? 'Correct' : 'Incorrect'} ({question.points} {question.points === 1 ? 'pt' : 'pts'})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px'}}>
                  <button
                    onClick={restartQuiz}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text)',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => navigate('/quizzes')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#e94560',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.backgroundColor = '#d83a50';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = '#e94560';
                    }}
                  >
                    Back to Quizzes
                  </button>
                </div>
              </div>
            </>
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

export default StorageMigrationQuiz;
