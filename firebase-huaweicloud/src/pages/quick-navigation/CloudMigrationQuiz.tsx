import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { QuizViolationNotification } from '../../components/QuizViolationNotification';
import { useQuizProtection } from '../../hooks/useQuizProtection';
import { saveQuizResult } from '../../services/quizService';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle} from 'lucide-react';
import '../../styles/DashboardPage.css';

interface Question {
  id: number;
  question: string;
  type: 'multiple-choice' | 'multiple-answer' | 'true-false';
  options?: string[];
  correctAnswer?: number | boolean;
  correctAnswers?: number[];
  explanation: string;
}

export const CloudMigrationQuiz: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number | number[] | boolean}>({});
  const [showExplanation, setShowExplanation] = useState<{[key: number]: boolean}>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
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

  const questions: Question[] = [
    {
      id: 1,
      question: "How many phases and steps does the Cloud Migration Framework (CMF) have?",
      type: "multiple-choice",
      options: ["5 phases and 10 steps", "7 phases and 12 steps", "6 phases and 14 steps", "8 phases and 15 steps"],
      correctAnswer: 1,
      explanation: "The CMF consists of 7 phases and 12 steps. These phases provide a comprehensive roadmap for enterprise cloud migration, from initial survey and evaluation through to final assurance and handover. Each phase builds upon the previous one to ensure thorough planning and successful execution."
    },
    {
      id: 2,
      question: "What are the three turns mentioned in the migration approach? (Select all that apply)",
      type: "multiple-answer",
      options: ["Turn mindset around", "Turn skills around", "Turn methods around", "Turn resources around"],
      correctAnswers: [0, 1, 2],
      explanation: "The three essential turns are: (1) Mindset - from transporter to architect/visionary, (2) Skills - developing comprehensive technical and strategic abilities, and (3) Methods - implementing the CMF methodology. These three turns represent the holistic transformation needed for successful cloud migration programs."
    },
    {
      id: 3,
      question: "Cloud migration should be positioned as merely transporting workloads to the cloud.",
      type: "true-false",
      correctAnswer: false,
      explanation: "This is incorrect. Cloud migration should be positioned as an opportunity to become architects and visionaries, not just transporters. The focus should be on customer value co-creation, business transformation, and strategic advantage rather than simple lift-and-shift operations."
    },
    {
      id: 4,
      question: "What is the minimum number of parties that need to cooperate for a successful cloud migration?",
      type: "multiple-choice",
      options: ["2 parties", "3 parties (iron triangle)", "4 parties", "5 parties"],
      correctAnswer: 1,
      explanation: "The 'iron triangle' team structure emphasizes cooperation between three critical parties: leadership and strategy, technical teams, and execution teams. This multi-stakeholder approach ensures alignment across business objectives, technical feasibility, and operational delivery."
    },
    {
      id: 5,
      question: "Which of the following are valid migration strategies mentioned in the 6 Rs? (Select all that apply)",
      type: "multiple-answer",
      options: ["Re-host", "Re-platform", "Re-architect (Refactor)", "Re-purchase", "Retain/Retire"],
      correctAnswers: [0, 1, 2, 3, 4],
      explanation: "All five options represent valid cloud migration strategies: Re-host (lift-and-shift), Re-platform (move and optimize), Re-architect (refactor for cloud), Re-purchase (switch solutions), and Retain/Retire (keep on-premises or decommission). Each strategy serves different business needs and application profiles."
    },
    {
      id: 6,
      question: "What is the first phase of the Cloud Migration Framework?",
      type: "multiple-choice",
      options: ["Planning", "Survey & Evaluation", "Architecture & Solution Design", "Migration"],
      correctAnswer: 1,
      explanation: "Survey & Evaluation is the first and critical phase. It includes comprehensive application status surveys, migration evaluation, and capability assessment. This phase gathers essential information needed for subsequent phases including application dependencies, technical requirements, and readiness evaluation."
    },
    {
      id: 7,
      question: "Which tools are mentioned for application status survey? (Select all that apply)",
      type: "multiple-answer",
      options: ["CMDB platform", "RDA tool", "Manual survey templates", "Configuration files", "Scripts"],
      correctAnswers: [0, 1, 2, 3, 4],
      explanation: "Effective surveys use multiple tools: CMDB platforms for comprehensive inventory, RDA tools for application analysis, manual templates for customized data collection, configuration files for detailed settings, and scripts for automated information gathering. A combination of these methods provides the most accurate and complete picture."
    },
    {
      id: 8,
      question: "What should be the primary focus when conducting a kickoff meeting?",
      type: "multiple-choice",
      options: ["Only technical details", "Only budget discussions", "Align organizations, objectives, and responsibilities", "Only project timeline"],
      correctAnswer: 2,
      explanation: "The kickoff meeting must align three critical areas: Organizations (team structures and stakeholders), Objectives (business goals and success criteria), and Responsibilities (who does what). This comprehensive alignment ensures all parties have a shared understanding and commitment to the migration program."
    },
    {
      id: 9,
      question: "Pre-sales to service handover should only focus on technical solutions.",
      type: "true-false",
      correctAnswer: false,
      explanation: "This is incorrect. The handover is much more comprehensive and must include: overall project status, detailed customer information, the complete cloud migration solution, key contract content and commitments, and identified risk items. A complete handover ensures smooth transition from pre-sales to delivery teams."
    },
    {
      id: 10,
      question: "What are the three layers in the 'Three Layers, Four Architectures, and Six Factors' methodology?",
      type: "multiple-choice",
      options: ["Application, Database, Network", "Business, Application, Infrastructure", "Frontend, Backend, Database", "Access, Compute, Storage"],
      correctAnswer: 1,
      explanation: "The three layers are: L0 Service Panorama (Business layer focusing on business value), L1 Application System (middleware and service layer), and L2 Application Component (infrastructure resources layer). This layered approach provides comprehensive analysis across business, application, and infrastructure dimensions."
    },
  ];

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


  const handleAnswer = (questionIndex: number, answerIndex: number | boolean) => {
    const question = questions[questionIndex];
    
    if (question.type === 'multiple-answer') {
      const currentAnswers = (selectedAnswers[questionIndex] as number[]) || [];
      const newAnswers = currentAnswers.includes(answerIndex as number)
        ? currentAnswers.filter(a => a !== answerIndex)
        : [...currentAnswers, answerIndex as number];
      
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex]: newAnswers
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex]: answerIndex
      });
    }
  };

  const checkAnswer = (questionIndex: number) => {
    const question = questions[questionIndex];
    const userAnswer = selectedAnswers[questionIndex];

    if (userAnswer === undefined || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      return;
    }

    let isCorrect = false;

    if (question.type === 'multiple-answer') {
      const sortedUser = [...(userAnswer as number[])].sort();
      const sortedCorrect = [...(question.correctAnswers || [])].sort();
      isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    } else if (question.type === 'true-false') {
      isCorrect = userAnswer === question.correctAnswer;
    } else {
      isCorrect = userAnswer === question.correctAnswer;
    }

    if (!showExplanation[questionIndex]) {
      setScore(score + (isCorrect ? 1 : 0));
    }

    setShowExplanation({
      ...showExplanation,
      [questionIndex]: true
    });
  };

  const checkAnswerSilent = (questionIndex: number): boolean => {
    const question = questions[questionIndex];
    const userAnswer = selectedAnswers[questionIndex];

    if (userAnswer === undefined) return false;

    if (question.type === 'multiple-answer') {
      const sortedUser = [...(userAnswer as number[])].sort();
      const sortedCorrect = [...(question.correctAnswers || [])].sort();
      return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    } else if (question.type === 'true-false') {
      return userAnswer === question.correctAnswer;
    } else {
      return userAnswer === question.correctAnswer;
    }
  };

  const handleCompleteQuiz = async () => {
    setQuizCompleted(true);
    
    if (user?.uid) {
      setIsSavingResults(true);
      try {
        // Build detailed answers array with all question info
        const detailedAnswers = questions.map((question, index) => {
          const userAnswer = selectedAnswers[index];
          const isCorrect = checkAnswerSilent(index);
          
          // Convert answers to strings for consistency
          let userAnswerStr = 'Not answered';
          let correctAnswerStr: string | string[] = 'N/A';
          
          if (userAnswer !== undefined) {
            if (typeof userAnswer === 'number') {
              userAnswerStr = question.options?.[userAnswer] || `Option ${userAnswer}`;
            } else if (typeof userAnswer === 'boolean') {
              userAnswerStr = userAnswer.toString();
            } else if (Array.isArray(userAnswer)) {
              userAnswerStr = userAnswer.map(idx => question.options?.[idx] || `Option ${idx}`).join(', ');
            }
          }
          
          if (question.correctAnswer !== undefined) {
            if (typeof question.correctAnswer === 'number') {
              correctAnswerStr = question.options?.[question.correctAnswer] || `Option ${question.correctAnswer}`;
            } else if (typeof question.correctAnswer === 'boolean') {
              correctAnswerStr = question.correctAnswer.toString();
            }
          } else if (question.correctAnswers) {
            correctAnswerStr = question.correctAnswers.map(idx => question.options?.[idx] || `Option ${idx}`);
          }
          
          return {
            questionId: index,
            question: question.question,
            userAnswer: userAnswerStr,
            correctAnswer: correctAnswerStr,
            isCorrect: isCorrect,
            points: isCorrect ? 1 : 0};
        });

        await saveQuizResult(
          user.uid,
          'cloud-migration-framework',
          'Cloud Migration Framework',
          currentScore,
          questions.length,
          detailedAnswers,
          timeSpent
        );
      } catch (error) {
        console.error('Error saving quiz results:', error);
      } finally {
        setIsSavingResults(false);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const allAnswered = Object.keys(showExplanation).length === questions.length;
  const currentScore = Object.keys(showExplanation).reduce((acc, key) => {
    return acc + (checkAnswerSilent(parseInt(key)) ? 1 : 0);
  }, 0);

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

  return (
    <AppLayout hideNavigation={protectionState.isQuizActive}>
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <main className="main-content">
          {!quizStarted ? (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
              <div style={{ backgroundColor: 'rgba(22, 33, 62, 0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '50px 40px', borderRadius: '12px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>Cloud Migration Framework Quiz</h1>
                <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '40px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 40px' }}>Test your knowledge on cloud migration policy, process, and requirement survey. This comprehensive quiz covers the Huawei Cloud Migration Framework (CMF) methodology.</p>

                <div style={{ backgroundColor: 'rgba(233, 69, 96, 0.1)', border: '1px solid rgba(233, 69, 96, 0.2)', padding: '24px', borderRadius: '8px', marginBottom: '40px', textAlign: 'left' }}>
                  <h3 style={{ marginBottom: '16px', color: 'var(--color-accent-light)', fontSize: '16px', fontWeight: '600' }}>Quiz Details</h3>
                  <ul style={{ color: 'var(--color-text-secondary)', lineHeight: '2', listStyle: 'none', padding: 0 }}>
                    <li>✓ <strong>{questions.length} Questions</strong> - Comprehensive coverage</li>
                    <li>✓ <strong>Multiple Formats</strong> - Choice, Multi-answer, True/False</li>
                    <li>✓ <strong>Time Tracking</strong> - Monitor your performance</li>
                    <li>✓ <strong>Instant Feedback</strong> - Detailed explanations for each answer</li>
                  </ul>
                </div>

                <button onClick={() => setQuizStarted(true)} style={{ padding: '12px 48px', fontSize: '16px', fontWeight: '600', backgroundColor: 'var(--color-accent-light)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)', boxShadow: '0 4px 12px rgba(233, 69, 96, 0.3)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d63948'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 69, 96, 0.4)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 69, 96, 0.3)'; }}>Start Quiz</button>
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
              <div style={{ backgroundColor: 'rgba(22, 33, 62, 0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '24px', borderRadius: '12px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>Question {currentQuestion + 1} of {questions.length}</span>
                    <div style={{ width: '280px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%`, height: '100%', backgroundColor: 'var(--color-accent-light)', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                    <div style={{ padding: '8px 16px', backgroundColor: 'rgba(14, 52, 96, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#6ba3ff', fontWeight: '600' }}>
                      <Clock size={14} style={{ marginRight: '6px', display: 'inline' }} /> {formatTime(timeSpent)}
                    </div>
                    <div style={{ padding: '8px 16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#10b981', fontWeight: '600' }}>
                      {Object.keys(showExplanation).length > 0 ? currentScore : '—'} / {Object.keys(showExplanation).length}
                    </div>
                  </div>
                </div>
              </div>

              {questions[currentQuestion] && (
                <div style={{ backgroundColor: 'rgba(22, 33, 62, 0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '32px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '12px', lineHeight: '1.5' }}>{questions[currentQuestion].question}</h2>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', backgroundColor: 'rgba(233, 69, 96, 0.15)', padding: '4px 12px', borderRadius: '4px', display: 'inline-block', border: '1px solid rgba(233, 69, 96, 0.2)' }}>
                      {questions[currentQuestion].type === 'multiple-answer' && '(Select all that apply)'}
                      {questions[currentQuestion].type === 'true-false' && '(True or False)'}
                      {questions[currentQuestion].type === 'multiple-choice' && '(Single choice)'}
                    </span>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    {questions[currentQuestion].type === 'true-false' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[true, false].map((option, idx) => {
                          const isSelected = selectedAnswers[currentQuestion] === option;
                          const isAnswered = showExplanation[currentQuestion];
                          const isCorrect = isAnswered ? checkAnswerSilent(currentQuestion) : null;
                          
                          return (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px', border: isSelected ? isAnswered ? isCorrect ? '2px solid #10b981' : '2px solid #ef4444' : '2px solid var(--color-accent-light)' : '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', cursor: isAnswered ? 'default' : 'pointer', backgroundColor: isSelected ? isAnswered ? isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' : 'rgba(233, 69, 96, 0.1)' : isAnswered && option === questions[currentQuestion].correctAnswer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)', transition: 'var(--transition-smooth)' }}>
                              <input type="radio" checked={isSelected} onChange={() => !isAnswered && handleAnswer(currentQuestion, option)} disabled={isAnswered} style={{ marginRight: '12px', cursor: 'pointer' }} />
                              <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{option ? 'True' : 'False'}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {questions[currentQuestion].options?.map((option, optionIdx) => {
                          const isSelected = questions[currentQuestion].type === 'multiple-answer' ? (selectedAnswers[currentQuestion] as number[])?.includes(optionIdx) : selectedAnswers[currentQuestion] === optionIdx;
                          const isAnswered = showExplanation[currentQuestion];
                          const isCorrectOption = questions[currentQuestion].type === 'multiple-answer' ? (questions[currentQuestion].correctAnswers || []).includes(optionIdx) : optionIdx === questions[currentQuestion].correctAnswer;

                          return (
                            <label key={optionIdx} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', border: isSelected ? isAnswered ? isCorrectOption ? '2px solid #10b981' : '2px solid #ef4444' : '2px solid var(--color-accent-light)' : isAnswered && isCorrectOption ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', cursor: isAnswered ? 'default' : 'pointer', backgroundColor: isSelected ? isAnswered ? isCorrectOption ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' : 'rgba(233, 69, 96, 0.1)' : isAnswered && isCorrectOption ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)', transition: 'var(--transition-smooth)' }}>
                              <input type={questions[currentQuestion].type === 'multiple-answer' ? 'checkbox' : 'radio'} checked={isSelected} onChange={() => !isAnswered && handleAnswer(currentQuestion, optionIdx)} disabled={isAnswered} style={{ marginRight: '12px', marginTop: '2px', cursor: 'pointer' }} />
                              <span style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!showExplanation[currentQuestion] && selectedAnswers[currentQuestion] !== undefined && (questions[currentQuestion].type !== 'multiple-answer' || (selectedAnswers[currentQuestion] as number[]).length > 0) && (
                    <button onClick={() => checkAnswer(currentQuestion)} style={{ padding: '10px 28px', backgroundColor: 'var(--color-accent-light)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px', transition: 'var(--transition-smooth)', boxShadow: '0 4px 12px rgba(233, 69, 96, 0.3)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d63948'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.transform = 'translateY(0)'; }}>Check Answer</button>
                  )}

                  {showExplanation[currentQuestion] && (
                    <div style={{ padding: '20px', backgroundColor: checkAnswerSilent(currentQuestion) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `2px solid ${checkAnswerSilent(currentQuestion) ? '#10b981' : '#ef4444'}`, borderRadius: '8px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        {checkAnswerSilent(currentQuestion) ? (<><CheckCircle style={{ color: '#10b981' }} size={24} /><span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>Correct!</span></>) : (<><XCircle style={{ color: '#ef4444' }} size={24} /><span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>Incorrect</span></>)}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <AlertCircle style={{ flexShrink: 0, marginTop: '4px', color: 'var(--color-text-secondary)' }} size={18} />
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{questions[currentQuestion].explanation}</p>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))} disabled={currentQuestion === 0} style={{ padding: '10px 24px', backgroundColor: currentQuestion === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(233, 69, 96, 0.2)', color: currentQuestion === 0 ? 'var(--color-text-secondary)' : 'var(--color-accent-light)', border: '1px solid ' + (currentQuestion === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(233, 69, 96, 0.3)'), borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => { if (currentQuestion > 0) { e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.3)'; } }} onMouseLeave={(e) => { if (currentQuestion > 0) { e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.2)'; } }}>← Previous</button>

                    {currentQuestion === questions.length - 1 && allAnswered ? (
                      <button onClick={handleCompleteQuiz} disabled={isSavingResults} style={{ padding: '10px 28px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; e.currentTarget.style.transform = 'translateY(0)'; }}>{isSavingResults ? 'Saving...' : 'Complete Quiz'}</button>
                    ) : (
                      <button onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))} disabled={currentQuestion === questions.length - 1} style={{ padding: '10px 28px', backgroundColor: currentQuestion === questions.length - 1 ? 'rgba(255, 255, 255, 0.05)' : 'var(--color-accent-light)', color: currentQuestion === questions.length - 1 ? 'var(--color-text-secondary)' : 'white', border: currentQuestion === questions.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: currentQuestion === questions.length - 1 ? 'not-allowed' : 'pointer', transition: 'var(--transition-smooth)', boxShadow: currentQuestion === questions.length - 1 ? 'none' : '0 4px 12px rgba(233, 69, 96, 0.3)' }} onMouseEnter={(e) => { if (currentQuestion < questions.length - 1) { e.currentTarget.style.backgroundColor = '#d63948'; e.currentTarget.style.transform = 'translateY(-2px)'; } }} onMouseLeave={(e) => { if (currentQuestion < questions.length - 1) { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.transform = 'translateY(0)'; } }}>Next →</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
              <div style={{ backgroundColor: 'rgba(22, 33, 62, 0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '50px 40px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '2px solid #10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                  <CheckCircle size={48} style={{ color: '#10b981' }} />
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '20px' }}>Quiz Complete!</h2>
                <div style={{ fontSize: '56px', fontWeight: 'bold', color: 'var(--color-accent-light)', marginBottom: '10px' }}>{currentScore} / {questions.length}</div>
                <p style={{ fontSize: '20px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>({((currentScore / questions.length) * 100).toFixed(1)}%)</p>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Clock size={16} /> Time spent: {formatTime(timeSpent)}
                </p>
                
                {currentScore / questions.length >= 0.8 ? (
                  <div style={{ padding: '24px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginBottom: '40px' }}>
                    <p style={{ color: '#10b981', fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>Excellent Performance!</p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>You've demonstrated strong knowledge of the Cloud Migration Framework. Keep up the great work!</p>
                  </div>
                ) : currentScore / questions.length >= 0.6 ? (
                  <div style={{ padding: '24px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', marginBottom: '40px' }}>
                    <p style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>Good Effort!</p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>You've shown understanding of key concepts. Review the questions you missed to strengthen your knowledge.</p>
                  </div>
                ) : (
                  <div style={{ padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '40px' }}>
                    <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>Keep Learning!</p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Review the explanations for the questions you missed and consider retaking the quiz to improve.</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => { setQuizStarted(false); setCurrentQuestion(0); setSelectedAnswers({}); setShowExplanation({}); setQuizCompleted(false); setScore(0); setTimeStarted(null); setTimeSpent(0); }} style={{ padding: '10px 32px', fontSize: '15px', fontWeight: '600', backgroundColor: 'var(--color-accent-light)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)', boxShadow: '0 4px 12px rgba(233, 69, 96, 0.3)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d63948'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.transform = 'translateY(0)'; }}>Retake Quiz</button>
                  <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 32px', fontSize: '15px', fontWeight: '600', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--color-text-primary)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>Back to Dashboard</button>
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

export default CloudMigrationQuiz;



