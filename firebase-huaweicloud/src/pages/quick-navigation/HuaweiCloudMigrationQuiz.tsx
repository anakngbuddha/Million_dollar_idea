import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { saveQuizResult } from '../../services/quizService';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Menu,
  X,
  Clock,
  BookOpen,
  BarChart4,
  Users,
  Settings,
  Search,
  Home,
} from 'lucide-react';
import '../../styles/DashboardPage.css';

interface Question {
  id: number;
  type: 'multiple' | 'checkbox' | 'true-false';
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export const HuaweiCloudMigrationQuiz: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number | number[]}>({});
  const [showExplanation, setShowExplanation] = useState<{[key: number]: boolean}>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSavingResults, setIsSavingResults] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      type: 'multiple',
      question: 'According to the Cloud Migration Framework, which phase includes "Migration solution design" and "Technical solution for migration"?',
      options: [
        'Survey & Evaluation',
        'Architecture & Solution Design',
        'Environment Deployment & Test',
        'Migration'
      ],
      correct: [1],
      explanation: 'The Architecture & Solution Design phase includes migration solution design, technical solution for migration, verification solutions, and target architecture design (cloud architecture, O&M architecture, security architecture, and landing zone).'
    },
    {
      id: 2,
      type: 'multiple',
      question: 'What is the recommended maximum size for a migration wave according to best practices?',
      options: [
        '10 applications, 100 servers, 20 databases',
        '20 applications, 150 servers, 30 databases',
        '30 applications, 200 servers, 40 databases',
        '40 applications, 250 servers, 50 databases'
      ],
      correct: [1],
      explanation: 'According to best practices, a wave can contain a maximum of 20 applications, 150 servers, and 30 databases. Waves larger than this are likely to fail and may need a rollback.'
    },
    {
      id: 3,
      type: 'checkbox',
      question: 'Which of the following are key steps in deploying the target architecture? (Select all that apply)',
      options: [
        'Enable connectivity',
        'Deploy cloud networks',
        'Provision resources',
        'Perform cutover drill',
        'Configure billing alerts'
      ],
      correct: [0, 1, 2, 3],
      explanation: 'The seven key steps are: Enable connectivity, Deploy cloud networks, Provision resources, Deploy/Migrate applications, Verification Test (Step 5), Verification Test (Step 6), and Perform a cutover drill. Billing alerts are part of financial management but not a key deployment step.'
    },
    {
      id: 4,
      type: 'multiple',
      question: 'In the "Replatform" migration strategy, what does "Lift and reshape" mean?',
      options: [
        'Migrates applications without any changes',
        'Migrates applications and makes a few adaptations',
        'Reconstructs applications based on cloud native',
        'Migrates applications to SaaS on the cloud'
      ],
      correct: [1],
      explanation: 'Replatform (Lift and reshape) migrates applications to the cloud and makes a few adaptations, such as migrating a MySQL database from an IDC to RDS or from Alibaba Cloud EDAS to Huawei Cloud ServiceStage.'
    },
    {
      id: 5,
      type: 'true-false',
      question: 'A VPN is preferred over a leased line (direct connection) for establishing connectivity during migration.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. A leased line (direct connection) is preferred, while a VPN is an alternative. Factors to consider include maximum bandwidth, latency, traffic fees, and link redundancy.'
    },
    {
      id: 6,
      type: 'checkbox',
      question: 'Which factors should be considered when designing a migration path? (Select all that apply)',
      options: [
        'System load impact',
        'Bandwidth requirements',
        'Migration time window',
        'Security compliance',
        'Cost considerations',
        'Marketing budget'
      ],
      correct: [0, 1, 2, 3, 4],
      explanation: 'The seven factors for migration path design are: System, Bandwidth, Time, Security, Cost, Selection (migration methods and tools), Resources, and Feasibility. Marketing budget is not a technical migration factor.'
    },
    {
      id: 7,
      type: 'multiple',
      question: 'What is the recommended duration for a migration wave according to industry best practices?',
      options: [
        '2 to 4 weeks',
        '4 to 8 weeks',
        '8 to 12 weeks',
        '12 to 16 weeks'
      ],
      correct: [1],
      explanation: 'A wave spanning four to eight weeks is most appropriate according to industry best practices. This time covers deployment, migration, and switchover, excluding the preparation phase.'
    },
    {
      id: 8,
      type: 'checkbox',
      question: 'Which "6 Rs" migration strategies have the HIGHEST migration difficulty and cost? (Select all that apply)',
      options: [
        'Rehost',
        'Replatform',
        'Rearchitect',
        'Repurchase',
        'Retire'
      ],
      correct: [2, 3],
      explanation: 'Rearchitect and Repurchase have the highest migration difficulty and cost, while providing high benefits. Rehost has the lowest difficulty and cost, while Retire has minimal cost and effort.'
    },
    {
      id: 9,
      type: 'true-false',
      question: 'When planning migration waves, systems from the same supplier should be migrated in different waves to minimize vendor lock-in.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. Systems of the same supplier should be migrated to the cloud in the same wave or adjacent waves. This allows the supplier to arrange required manpower efficiently, ensure collaboration between project teams, and facilitate smooth migration.'
    },
    {
      id: 10,
      type: 'multiple',
      question: 'In the private line deployment process, how many days is the baseline SLA for "Requirement analysis and solution development"?',
      options: [
        '1 day',
        '2 days',
        '7 days',
        '14 days'
      ],
      correct: [1],
      explanation: 'The baseline SLA for requirement analysis and solution development is 2 days for baseline solutions. Non-standard solutions require 14 days.'
    },
    {
      id: 11,
      type: 'checkbox',
      question: 'Which data verification methods should be used for different types of data? (Select all correct pairs)',
      options: [
        'Historical data: Check file size, MD5, and number of records',
        'Incremental data: Check number of records, MD5, and file size',
        'Real-time data: Check full data records in the previous period',
        'Historical data: Monitor forward traffic of topics',
        'All data: HBase and Presto require migration verification'
      ],
      correct: [0, 1, 2],
      explanation: 'Historical data should be checked using file size, MD5, and number of records. Incremental data uses similar methods. Real-time data checks full data records in the previous period. HBase and Presto data do NOT need migration verification.'
    },
    {
      id: 12,
      type: 'multiple',
      question: 'What is a "Migration Group" in Huawei Cloud migration terminology?',
      options: [
        'A team of engineers responsible for migration',
        'A collection of applications and infrastructure with dependencies',
        'A set of migration tools bundled together',
        'A phase in the migration methodology'
      ],
      correct: [1],
      explanation: 'A Migration Group is a collection of applications and infrastructure that have dependencies (including environment dependencies), including applications, hosts, storage, databases, and middleware.'
    },
    {
      id: 13,
      type: 'true-false',
      question: 'During cutover drills, all steps, actions, and migration processes must be identical to those planned for the actual switchover day.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. All steps, actions, and migration processes of the switchover drill must be the same as those on the day of the switchover. Any differences must be clarified with the customer.'
    },
    {
      id: 14,
      type: 'checkbox',
      question: 'Which are the three main types of switchover solutions? (Select all that apply)',
      options: [
        'Switchover with services interrupted',
        'Switchover with writing interrupted but reading uninterrupted',
        'Switchover with services uninterrupted',
        'Switchover with minimal latency',
        'Gradual switchover over 30 days'
      ],
      correct: [0, 1, 2],
      explanation: 'The three switchover solutions are: (1) Switchover with services interrupted - most commonly used, small investment, low risk; (2) Switchover with writing interrupted but reading uninterrupted - core read services not interrupted; (3) Switchover with services uninterrupted - no service interruption but highest complexity.'
    },
    {
      id: 15,
      type: 'multiple',
      question: 'When establishing a Landing Zone, which service is used for centralized billing and cost management?',
      options: [
        'Cloud Eye',
        'Central Billing',
        'IAM',
        'RMS'
      ],
      correct: [1],
      explanation: 'Central Billing is used in the Finance/Cost management aspect of Landing Zone, along with Spending Alarm, Cost Analysis, and Cost Optimization.'
    },
    {
      id: 16,
      type: 'checkbox',
      question: 'Which factors determine migration priority when the customer has no clear preference? (Select all that apply)',
      options: [
        'Service environment (dev/test/prod)',
        'Service importance (common/important/core)',
        'Service dependency complexity',
        'Infrastructure complexity',
        'Allowed downtime',
        'Team size'
      ],
      correct: [0, 1, 2, 3, 4],
      explanation: 'Migration priority is scored based on: service environment (migrate test before production), service importance (common before core), service dependency (simple before complex), infrastructure complexity (simple before complex), allowed downtime (longer before shorter), and migration strategy. Team size is not a scoring factor.'
    },
    {
      id: 17,
      type: 'true-false',
      question: 'In the "Four Architectures and Six Factors" framework, Cost is one of the six non-functional factors.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. The six non-functional factors in cloud architecture design are: Availability, Security, Scalability, Performance, Cost, and Maintainability.'
    },
    {
      id: 18,
      type: 'multiple',
      question: 'Which Huawei Cloud service is recommended for one-stop monitoring with capabilities for CCE cluster/node metrics, workload/POD/container metrics, and APIs?',
      options: [
        'Cloud Eye',
        'AOM (Application Operations Management)',
        'LTS (Log Tank Service)',
        'CTS (Cloud Trace Service)'
      ],
      correct: [1],
      explanation: 'AOM (Application Operations Management) provides one-stop monitoring for CCE clusters, nodes, workloads, PODs, containers, jobs, and APIs. Cloud Eye is for general cloud resource monitoring, LTS for logs, and CTS for audit trails.'
    },
    {
      id: 19,
      type: 'checkbox',
      question: 'In the migration group planning, which are the three most influential factors for adding applications to one group? (Select all that apply)',
      options: [
        'Shared data dependency',
        'Shared server dependency',
        'Communication dependency between applications',
        'Same development team',
        'Similar business function'
      ],
      correct: [0, 1, 2],
      explanation: 'The three most influential factors are: (1) Shared data dependency - applications sharing databases, (2) Shared server dependency - applications on the same servers, and (3) Communication dependency between applications. Team structure and business function are secondary considerations.'
    },
    {
      id: 20,
      type: 'true-false',
      question: 'According to IAM best practices, access keys should be written directly into application code for convenience.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. You should NOT write access keys into code. Instead, consider using 3rd party secret management tools such as HashiCorp Vault, Akeyless Vault, or Docker Secret for secure credential management.'
    },
    {
      id: 21,
      type: 'multiple',
      question: 'What is the PRIMARY purpose of a Landing Zone in cloud migration?',
      options: [
        'A temporary storage area for migrated data',
        'A testing environment for applications',
        'A secure, compliant, scalable multi-account environment',
        'A backup location for disaster recovery'
      ],
      correct: [2],
      explanation: 'A Landing Zone is a secure, compliant, and scalable multi-account environment that enables resource sharing among accounts and unified management of manpower, finance, materials, permissions, and law compliance. It\'s similar to the public decoration part of an office building and is the first step when moving to the cloud.'
    },
    {
      id: 22,
      type: 'checkbox',
      question: 'Which monitoring thresholds are strongly recommended for host network monitoring? (Select all that apply)',
      options: [
        'Receive Error Packet Rate > 0',
        'Send Error Packet Rate > 0',
        'CPU usage > 80%',
        'Memory usage > 90%',
        'Receive BPS (recvBytesRate)'
      ],
      correct: [0, 1],
      explanation: 'It is strongly recommended that customers configure: Receive Error Packet Rate (threshold: > 0, statistical period: 1 minute, continuous period: 3) and Send Error Packet Rate (same thresholds). These help detect network issues quickly.'
    },
    {
      id: 23,
      type: 'multiple',
      question: 'In Project F\'s application migration case study, which tool was used for releasing containerized applications to Huawei Cloud CCE Turbo?',
      options: [
        'Jenkins',
        'AMS (customer-developed tool)',
        'Kubernetes native deployment',
        'SMS (Server Migration Service)'
      ],
      correct: [1],
      explanation: 'The customer-developed AMS tool was used, which was interconnected with Huawei Cloud CCE Turbo and intranet DNS services in advance to release containerized applications.'
    },
    {
      id: 24,
      type: 'true-false',
      question: 'When performing data migration verification for Kafka real-time data, you should check the full data consistency across all partitions.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. For Kafka real-time data verification, you should monitor the forward traffic of the corresponding topic, not full data consistency. Different data types require different verification methods.'
    },
    {
      id: 25,
      type: 'checkbox',
      question: 'Which services are part of the Cloud Governance Center in a Landing Zone? (Select all that apply)',
      options: [
        'Control Tower',
        'Organization & Identity',
        'RMS (Resource Management Service)',
        'Central Billing',
        'AOM (Application Operations Management)'
      ],
      correct: [0, 1, 2, 3],
      explanation: 'The Cloud Governance Center includes: Control Tower, Organization & Identity (Organization, IAM Identity Center, IAM, Policy Analyzer), Resources (RMS, RAM, TMS), Compliance (CSB, RMS, CTS), and Finance/Cost (Central Billing, Spending Alarm, Cost Analysis). AOM is part of the Monitoring category, not governance.'
    },
    {
      id: 26,
      type: 'multiple',
      question: 'For the "Rearchitect" migration strategy, what is the customer\'s PRIMARY motivation?',
      options: [
        'Cost reduction',
        'Innovation acceleration',
        'Availability improvement',
        'Regulatory compliance'
      ],
      correct: [1],
      explanation: 'Rearchitect is primarily chosen for innovation acceleration to improve competitiveness and business agility. It allows reconstruction of applications into microservices to shorten time-to-market for new functions, though it has high migration period, cost, and difficulty.'
    },
    {
      id: 27,
      type: 'checkbox',
      question: 'What are the key handover actions after switchover? (Select all that apply)',
      options: [
        'Establish an assurance team',
        'Resource monitoring and deep inspection',
        'Live network change control',
        'Strengthen monitoring in key scenarios',
        'Establish regular communication system',
        'Immediate team disbandment'
      ],
      correct: [0, 1, 2, 3, 4],
      explanation: 'All five key handover actions should be implemented: (1) Establish assurance team with PM, SRE, TAM, ITA, (2) Resource monitoring and deep inspection, (3) Live network change control with TAM/SRE review, (4) Strengthen monitoring for service rollout, upgrades, and key scenarios, (5) Establish regular communication (weekly/bi-weekly meetings). Team should remain engaged, not disband.'
    },
    {
      id: 28,
      type: 'true-false',
      question: 'In a switchover with services uninterrupted, data consistency can always be guaranteed through dual-write or two-way synchronization.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. Switchover with services uninterrupted CANNOT ensure data consistency. While it provides no service interruption, it has risks including data inconsistency and potential functional risks. It requires 30+ days of service reconstruction and has high complexity.'
    },
    {
      id: 29,
      type: 'multiple',
      question: 'According to the document, what is the maximum number of times AOM collection probes should be limited to on a single node?',
      options: [
        '10 probes',
        '15 probes',
        '20 probes',
        '25 probes'
      ],
      correct: [2],
      explanation: 'It is recommended that the number of probes that use APM (Application Performance Management) on a single node be limited to 20. The consumption is related to the number of probes, inter-service invocation times, and sampling rate.'
    },
    {
      id: 30,
      type: 'checkbox',
      question: 'Which tools are mentioned for migrating storage data (OSS, EBS, NAS) in Project F? (Select all that apply)',
      options: [
        'OMS (Object Migration Service)',
        'Rclone',
        'SCP',
        'DRS (Data Replication Service)',
        'CDM (Cloud Data Migration)'
      ],
      correct: [0, 1, 2],
      explanation: 'For storage migration in Project F, three tools were used: OMS (Object Migration Service), Rclone, and SCP to migrate full and incremental storage data from OSS, EBS, and NAS to OBS, EVS, and SFS Turbo. DRS is for databases and CDM is for big data scenarios.'
    }
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

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    const question = questions[questionIndex];
    
    if (question.type === 'checkbox') {
      const currentAnswers = (selectedAnswers[questionIndex] as number[]) || [];
      const newAnswers = currentAnswers.includes(answerIndex)
        ? currentAnswers.filter(a => a !== answerIndex)
        : [...currentAnswers, answerIndex];
      
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

    if (question.type === 'checkbox') {
      const sortedUser = [...(userAnswer as number[])].sort();
      const sortedCorrect = [...question.correct].sort();
      isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    } else {
      isCorrect = Array.isArray(question.correct) ? (userAnswer as number) === question.correct[0] : false;
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

    if (question.type === 'checkbox') {
      const sortedUser = [...(userAnswer as number[])].sort();
      const sortedCorrect = [...question.correct].sort();
      return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    } else {
      return Array.isArray(question.correct) ? (userAnswer as number) === question.correct[0] : false;
    }
  };

  const handleCompleteQuiz = async () => {
    setQuizCompleted(true);
    
    if (user?.uid) {
      setIsSavingResults(true);
      try {
        const detailedAnswers = questions.map((question, index) => {
          const userAnswer = selectedAnswers[index];
          const isCorrect = checkAnswerSilent(index);
          
          let userAnswerStr = 'Not answered';
          let correctAnswerStr: string | string[] = 'N/A';
          
          if (userAnswer !== undefined) {
            if (typeof userAnswer === 'number') {
              userAnswerStr = question.options[userAnswer];
            } else if (Array.isArray(userAnswer)) {
              userAnswerStr = userAnswer.map(idx => question.options[idx]).join(', ');
            }
          }
          
          correctAnswerStr = question.correct.map(idx => question.options[idx]);
          
          return {
            questionId: index,
            question: question.question,
            userAnswer: userAnswerStr,
            correctAnswer: correctAnswerStr,
            isCorrect: isCorrect,
            points: isCorrect ? 1 : 0,
          };
        });

        await saveQuizResult(
          user.uid,
          'huawei-cloud-migration',
          'Huawei Cloud Migration Essentials',
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

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: BookOpen, label: 'My Quizzes', href: '/quizzes', active: true },
    { icon: BarChart4, label: 'Performance', href: '/analytics' },
    { icon: Users, label: 'Community', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ];

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <div className="nav-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="nav-logo">
              <div className="logo-icon">Q</div>
              <span className="nav-title">QuizHub</span>
            </div>
          </div>

          <div className="nav-right">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search quizzes..." />
            </div>
            <div className="divider-line"></div>
            <div className="profile-section">
              <div className="profile-info">
                <div className="profile-name">{user.displayName || user.email?.split('@')[0]}</div>
                <div className="profile-role">Student</div>
              </div>
              <div className="profile-avatar" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="profile-avatar-image" />
                ) : (
                  <span style={{ color: '#4285F4', fontWeight: '700' }}>{(user.email?.[0] || 'U').toUpperCase()}</span>
                )}
                
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <p>{user.email}</p>
                    </div>
                    <div className="dropdown-items">
                      <button onClick={handleLogout} disabled={logoutLoading} className="dropdown-item danger">
                        <LogOut size={14} />
                        {logoutLoading ? 'Logging out...' : 'Logout'}
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
        <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
          <div className="sidebar-items">
            {navigationItems.map((item) => (
              <a key={item.label} href={item.href} className={`sidebar-item ${item.active ? 'active' : ''}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-tip">
              <div className="sidebar-tip-label">Pro Tip</div>
              <div className="sidebar-tip-text">Review the explanations to strengthen your knowledge!</div>
            </div>
          </div>
        </aside>

        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          {!quizStarted ? (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
              <div style={{ backgroundColor: 'rgba(22, 33, 62, 0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '50px 40px', borderRadius: '12px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>Huawei Cloud Migration Essentials</h1>
                <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '40px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 40px' }}>Test your knowledge on Huawei Cloud migration best practices, strategies, and implementation details. This comprehensive quiz covers migration frameworks, architecture design, and real-world case studies.</p>

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
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px' }}>
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
                      {questions[currentQuestion].type === 'checkbox' && '(Select all that apply)'}
                      {questions[currentQuestion].type === 'true-false' && '(True or False)'}
                      {questions[currentQuestion].type === 'multiple' && '(Single choice)'}
                    </span>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    {questions[currentQuestion].type === 'true-false' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {['True', 'False'].map((option, idx) => {
                          const isSelected = selectedAnswers[currentQuestion] === idx;
                          const isAnswered = showExplanation[currentQuestion];
                          const isCorrect = isAnswered ? checkAnswerSilent(currentQuestion) : null;
                          
                          return (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px', border: isSelected ? isAnswered ? isCorrect ? '2px solid #10b981' : '2px solid #ef4444' : '2px solid var(--color-accent-light)' : '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', cursor: isAnswered ? 'default' : 'pointer', backgroundColor: isSelected ? isAnswered ? isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' : 'rgba(233, 69, 96, 0.1)' : isAnswered && idx === questions[currentQuestion].correct[0] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)', transition: 'var(--transition-smooth)' }}>
                              <input type="radio" checked={isSelected} onChange={() => !isAnswered && handleAnswer(currentQuestion, idx)} disabled={isAnswered} style={{ marginRight: '12px', cursor: 'pointer' }} />
                              <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {questions[currentQuestion].options.map((option, optionIdx) => {
                          const isSelected = questions[currentQuestion].type === 'checkbox' ? (selectedAnswers[currentQuestion] as number[])?.includes(optionIdx) : selectedAnswers[currentQuestion] === optionIdx;
                          const isAnswered = showExplanation[currentQuestion];
                          const isCorrectOption = questions[currentQuestion].correct.includes(optionIdx);

                          return (
                            <label key={optionIdx} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', border: isSelected ? isAnswered ? isCorrectOption ? '2px solid #10b981' : '2px solid #ef4444' : '2px solid var(--color-accent-light)' : isAnswered && isCorrectOption ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', cursor: isAnswered ? 'default' : 'pointer', backgroundColor: isSelected ? isAnswered ? isCorrectOption ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' : 'rgba(233, 69, 96, 0.1)' : isAnswered && isCorrectOption ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)', transition: 'var(--transition-smooth)' }}>
                              <input type={questions[currentQuestion].type === 'checkbox' ? 'checkbox' : 'radio'} checked={isSelected} onChange={() => !isAnswered && handleAnswer(currentQuestion, optionIdx)} disabled={isAnswered} style={{ marginRight: '12px', marginTop: '2px', cursor: 'pointer' }} />
                              <span style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!showExplanation[currentQuestion] && selectedAnswers[currentQuestion] !== undefined && (questions[currentQuestion].type !== 'checkbox' || (selectedAnswers[currentQuestion] as number[]).length > 0) && (
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
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>You've demonstrated strong knowledge of Huawei Cloud migration essentials. Keep up the great work!</p>
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
  );
};

export default HuaweiCloudMigrationQuiz;
