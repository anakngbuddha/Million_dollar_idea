import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { saveQuizResult } from '../../services/quizService';
import {
  ArrowLeft,
  Search,
  Clock,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  CheckCircle,
  XCircle,
  Award,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';
import '../../styles/DashboardPage.css';

const quizStyles = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0.3); }
    50% { box-shadow: 0 0 0 10px rgba(233, 69, 96, 0); }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  @keyframes checkmark {
    0% { transform: scale(0) rotate(-45deg); }
    100% { transform: scale(1) rotate(0); }
  }

  .quiz-option-enter {
    animation: slideInUp 0.3s ease-out;
  }

  .quiz-result-enter {
    animation: slideInUp 0.4s ease-out;
  }

  .pulse-button {
    animation: pulse-glow 2s infinite;
  }
`;


interface Question {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'multiple-answer';
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export const MigrationQuizChap6_7: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSavingResults, setIsSavingResults] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'What is the average migration speed for OMS (Object Storage Migration Service)?',
      options: ['10 TB/day', '20 TB/day', '30 TB/day', '40 TB/day'],
      correct: [1],
      explanation: 'OMS achieves an average migration speed of 20 TB/day with a peak capacity of 40 TB/day. This high throughput makes OMS ideal for large-scale storage migrations. The actual speed depends on network bandwidth, source/destination performance, and data characteristics. When planning migrations, account for network congestion during peak hours which may reduce effective throughput.'
    },
    {
      id: 2,
      type: 'true-false',
      question: 'DRS (Data Replication Service) supports the use of localStorage and sessionStorage APIs in artifacts.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. DRS does not support browser storage APIs (localStorage and sessionStorage). When migrating applications that rely on these APIs, you need to either refactor the application to use server-side storage solutions like Redis or database caches, or migrate to a platform that supports these APIs. This is a critical consideration during application migration planning.'
    },
    {
      id: 3,
      type: 'multiple-answer',
      question: 'Which of the following are key milestones in a database migration project? (Select all that apply)',
      options: ['Project planning', 'Service switchover and observation', 'Data migration', 'Marketing campaign', 'Acceptance'],
      correct: [0, 1, 2, 4],
      explanation: 'The critical milestones in database migration are: (1) Project planning - define scope, timeline, and resource allocation; (2) Development and testing - validate migration scripts and data integrity; (3) Data migration - execute the actual data transfer; (4) Service switchover and observation - route traffic to new system and monitor closely; (5) Acceptance - formal sign-off after stability verification. "Marketing campaign" is not a technical milestone. Following these phases reduces risk and ensures data integrity.'
    },
    {
      id: 4,
      type: 'multiple-choice',
      question: 'What is the reliability percentage of OBS (Object Storage Service)?',
      options: ['99.99%', '99.999%', '99.9999999999%', '99.99999999%'],
      correct: [2],
      explanation: 'OBS provides 99.9999999999% (twelve nines) reliability, meaning only 0.00000000001% downtime annually. This exceptional reliability is achieved through: geo-redundant replication, multiple data copies across AZs, continuous integrity checks, and automatic recovery mechanisms. This level ensures mission-critical storage needs are met. Understanding SLA percentages helps calculate acceptable downtime windows for your applications.'
    },
    {
      id: 5,
      type: 'true-false',
      question: 'In MongoDB 4.0, each service user must have both read and readAnyDatabase permissions on the admin database.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. This is a version difference: MongoDB 4.0 improved permission handling and only requires the read permission on the admin database for service users. MongoDB 3.0 and earlier required both read and readAnyDatabase permissions. When upgrading MongoDB or migrating between versions, review and update security policies. This change reduces complexity and improves the principle of least privilege in security.'
    },
    {
      id: 6,
      type: 'multiple-choice',
      question: 'What is the maximum object size supported by OBS?',
      options: ['10 TB', '24 TB', '48 TB', '100 TB'],
      correct: [2],
      explanation: 'OBS (Object Storage Service) supports individual objects up to 48 TB in size. This is crucial for storing large media files, database backups, and data warehouses. Objects are stored with redundancy across multiple zones. For objects exceeding 100GB, multipart upload is recommended to improve reliability and performance. Understanding object size limits helps design efficient storage architectures.'
    },
    {
      id: 7,
      type: 'multiple-answer',
      question: 'Which migration tools are mentioned for database migration? (Select all that apply)',
      options: ['DRS', 'OMS', 'Non-commercial tool', 'DES', 'CSG'],
      correct: [0, 2],
      explanation: 'DRS (Data Replication Service) is Huawei Cloud\'s primary tool for database migration with support for incremental replication and minimal downtime. Non-commercial tools like mysqldump, pg_dump, and custom scripts are also commonly used for smaller migrations or specific requirements. OMS handles storage/object migration. Understanding tool selection criteria (data volume, schema complexity, downtime tolerance) is essential for successful migrations.'
    },
    {
      id: 8,
      type: 'true-false',
      question: 'For RDS DB instances with medium performance specifications (8 cores, 16/32 GB), it is recommended to use 32 shards per instance.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. Shard count should scale with instance capacity: Medium instances (8 cores) = 16 shards, High-spec instances (16 cores) = 32 shards. This 1 shard per 0.5 core ratio balances parallelism and memory overhead. Too many shards increases management complexity and memory consumption; too few limits concurrency. Proper shard sizing directly impacts query performance and system stability.'
    },
    {
      id: 9,
      type: 'multiple-choice',
      question: 'What is the recommended disk usage percentage to maintain for RDS storage capacity?',
      options: ['40-50%', '50-60%', '60-70%', '70-80%'],
      correct: [2],
      explanation: 'Maintain disk usage at 60-70% capacity as a best practice. This buffer (30-40% free space) accommodates: transaction logs, temporary files, index growth, and operational overhead. When disk approaches 80%+, performance degrades significantly. Usage above 90% causes major performance issues and risks service interruption. Implement automated alerts at 75% to trigger capacity expansion before problems occur.'
    },
    {
      id: 10,
      type: 'multiple-answer',
      question: 'Which are valid MySQL architecture evolution stages? (Select all that apply)',
      options: ['Single-Node Architecture', 'Primary/Standby Architecture', 'Distributed Architecture with Sharding', 'Cloud-only Architecture', 'Quantum Architecture'],
      correct: [0, 1, 2],
      explanation: 'MySQL evolves through three proven stages: (1) Single-Node - simple, suitable for small apps; (2) Primary/Standby with read replicas - adds HA and read scaling; (3) Distributed with sharding - enables horizontal scaling for massive datasets. Each stage increases complexity but improves availability and performance. "Cloud-only" and "Quantum" are not recognized architectural patterns. Plan architecture based on growth projections and availability requirements.'
    },
    {
      id: 11,
      type: 'true-false',
      question: 'EVS (Elastic Volume Service) supports up to 64 TB for a single disk.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. EVS maximum disk size is 32 TB per volume. For storage needs exceeding 32 TB, implement striping or spanning across multiple EVS volumes. EVS provides three-copy replication for data durability across availability zones. Understanding volume limits is crucial when planning storage architecture for large databases and data warehouses.'
    },
    {
      id: 12,
      type: 'multiple-choice',
      question: 'In the database migration timeline, when should "Complete data synchronization" occur?',
      options: ['Day T+20', 'Day T+40', 'Day T+60', 'Day T+150'],
      correct: [2],
      explanation: 'Complete data synchronization typically completes at Day T+60 in a structured 160-day migration timeline. This allows time for: full schema migration (Days 0-20), initial data bulk transfer (Days 20-40), validation and testing (Days 40-60), and final go-live preparations (Days 60-160). This phased approach minimizes risk and allows comprehensive testing before switchover.'
    },
    {
      id: 13,
      type: 'multiple-answer',
      question: 'What are the three layers of a distributed database logical architecture? (Select all that apply)',
      options: ['Compute layer', 'Storage layer', 'Metadata layer', 'Application layer', 'Network layer'],
      correct: [0, 1, 2],
      explanation: 'Distributed databases employ a 3-layer architecture: (1) Compute Layer (SQL processing) - parses queries, handles distributed execution; (2) Storage Layer - manages actual data across multiple nodes with replication; (3) Metadata Layer - maintains routing info, shard locations, and consistency rules. This separation enables independent scaling and improves fault isolation.'
    },
    {
      id: 14,
      type: 'true-false',
      question: 'SFS (Scalable File Service) has 99.99999999% (ten nines) reliability.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. SFS (Scalable File Service) provides 99.99999999% (ten nines) reliability through multi-AZ replication and automatic failover. This high reliability makes SFS suitable for mission-critical shared storage needs. SFS supports NFS protocol for POSIX-compliant file access across multiple compute instances, enabling scalable file sharing for cloud-native applications.'
    },
    {
      id: 15,
      type: 'multiple-choice',
      question: 'What is the storage capacity limit for a single RDS DB instance on Huawei Cloud?',
      options: ['2 TB', '4 TB', '8 TB', '16 TB'],
      correct: [1],
      explanation: 'Single RDS instance maximum is 4 TB storage. For databases exceeding this limit, implement: (1) Read replicas for read scaling, (2) Sharding for write scaling, (3) Migration to DDM (Distributed Data Middleware) for transparent distribution. Understanding limits ensures proper architecture design for growing applications.'
    },
    {
      id: 16,
      type: 'multiple-answer',
      question: 'Which special characters are recommended for DDS passwords? (Select all that apply)',
      options: ['Asterisk (*)', 'Exclamation mark (!)', 'Dollar sign ($)', 'Ampersand (&)', 'At symbol (@)'],
      correct: [0, 1],
      explanation: 'For DDS password security, use only asterisk (*) and exclamation mark (!) as special characters. Other special characters ($, &, @, etc.) may be truncated or cause encoding issues across different components. This limitation emphasizes the importance of password complexity through length and mixed character types. Always verify platform-specific password requirements during setup.'
    },
    {
      id: 17,
      type: 'true-false',
      question: 'When migrating to DDM, performing level-1 sharding (database sharding without table sharding) can maximize DDM performance.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. Level-1 sharding (horizontal - sharding at database level) enables parallel execution across database nodes in DDM, significantly improving query performance. Level-2 sharding (table-level within databases) forces serial execution of table shards, creating a bottleneck. Choose level-1 when hot data distribution is even; use level-2 for fine-grained data distribution with uneven access patterns.'
    },
    {
      id: 18,
      type: 'multiple-choice',
      question: 'How many table shards are recommended if there are 1 billion data records and a single table should contain no more than 10 million records?',
      options: ['50 shards', '100 shards', '150 shards', '200 shards'],
      correct: [1],
      explanation: 'Calculation: 1 billion records ÷ 10 million records per shard = 100 shards. This formula ensures: (1) No single table becomes too large (maintaining query performance), (2) Appropriate parallelism across shards, (3) Balanced I/O distribution. As data grows, add shards proportionally. Plan shard count conservatively since resharding later is operationally expensive.'
    },
    {
      id: 19,
      type: 'multiple-answer',
      question: 'What types of vertical sharding are mentioned? (Select all that apply)',
      options: ['Vertical table sharding', 'Vertical database sharding', 'Vertical column sharding', 'Vertical row sharding'],
      correct: [0, 1],
      explanation: 'Vertical sharding splits data by columns/tables across nodes: (1) Vertical table sharding - different tables on different nodes (normalization); (2) Vertical database sharding - split wide tables by column groups for reducing I/O. Horizontal sharding (row-based) is separate. Vertical approaches are useful when tables have many columns and queries typically access subsets. Combine both for maximum scalability.'
    },
    {
      id: 20,
      type: 'true-false',
      question: 'DRS full synchronization can synchronize table structures, indexes, unique keys, and primary keys.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. DRS full synchronization (initial load phase) transfers: table schemas, indexes (including composite indexes), unique constraints, primary keys, and foreign keys. However, stored procedures, functions, and triggers may require separate handling. DRS then performs incremental replication of DML (INSERT/UPDATE/DELETE) changes. This comprehensive approach ensures destination database structure matches source perfectly.'
    },
    {
      id: 21,
      type: 'multiple-choice',
      question: 'For a DDM instance with 8 CPU cores and 16 GB memory, what is the approximate QPS performance baseline?',
      options: ['22,563', '45,158', '88,138', '126,855'],
      correct: [1],
      explanation: 'A DDM instance with 8 cores and 16 GB delivers ~45,158 QPS in baseline testing. Performance scales roughly linearly with resources: 4 cores/8 GB ≈ 22,563 QPS; 16 cores/32 GB ≈ 88,138 QPS. Actual performance depends on: query complexity, shard count, network latency, and storage backend speed. Always conduct load testing with your specific workload for accurate capacity planning.'
    },
    {
      id: 22,
      type: 'multiple-answer',
      question: 'Which migration methods are mentioned for PostgreSQL databases? (Select all that apply)',
      options: ['Online migration (full)', 'Online migration (full+incremental)', 'Offline migration', 'Hybrid migration'],
      correct: [0, 1],
      explanation: 'PostgreSQL migration capabilities evolved: (1) Version 9.4 - supports online full migration (complete data transfer while source runs); (2) Versions 10+ - support online full+incremental migration (full transfer + continuous WAL replication for zero-downtime). Online incremental replication enables near-zero downtime cutover. Choose offline only when application can tolerate downtime.'
    },
    {
      id: 23,
      type: 'true-false',
      question: 'In distributed databases, a global table (broadcast table) stores full and identical data in each database shard.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. Global/broadcast tables are replicated in full to every shard node, enabling local joins without cross-shard communication. Perfect for reference/lookup tables (countries, categories, status codes) accessed by many sharded queries. Use global tables judiciously - excessive data replication increases storage and update overhead. Ideal size: <100 MB per global table.'
    },
    {
      id: 24,
      type: 'multiple-choice',
      question: 'What is the total number of CPU cores recommended for DDM instances relative to RDS instances?',
      options: ['Equal to RDS', 'Half of RDS', 'Double of RDS', 'Quarter of RDS'],
      correct: [1],
      explanation: 'Recommended sizing: Total DDM cores = 50% of RDS backend cores. Example: 2x RDS instances with 16 cores each (32 total) → allocate 16 cores across DDM nodes. DDM functions as query router/coordinator with less CPU demand than storage engines. This ratio balances query routing overhead, network I/O, and cost efficiency.'
    },
    {
      id: 25,
      type: 'multiple-answer',
      question: 'Which services does OMS support migration from? (Select all that apply)',
      options: ['AWS S3', 'Azure', 'Alibaba Cloud OSS', 'Tencent Cloud', 'Google Cloud Storage'],
      correct: [0, 1, 2, 3],
      explanation: 'OMS enables multi-cloud data migration from: AWS S3, Azure Blob Storage, Alibaba Cloud OSS, and Tencent Cloud. OMS handles source authentication, bandwidth optimization, error recovery, and integrity verification automatically. Note: Google Cloud Storage is not listed as a supported source. This cloud-agnostic approach facilitates true cloud independence and minimizes vendor lock-in.'
    },
    {
      id: 26,
      type: 'true-false',
      question: 'During incremental synchronization in MySQL migration, the values of innodb_flush_log_at_trx_commit and sync_binlog should be changed to 2 and 500 respectively.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. During full bulk load (initial sync), set innodb_flush_log_at_trx_commit=2 and sync_binlog=500 to sacrifice some durability for speed. During incremental sync, revert to 1 (fsync on every commit) for maximum durability and consistency. This ensures: fast initial load + safe ongoing replication. Incorrectly using aggressive settings during incremental sync risks data loss.'
    },
    {
      id: 27,
      type: 'multiple-choice',
      question: 'What is the durability percentage for EVS with three-copy redundancy in a single AZ?',
      options: ['99.9%', '99.999%', '99.9999999%', '99.99999999%'],
      correct: [2],
      explanation: 'EVS achieves 99.9999999% (nine nines) durability within a single AZ using 3 synchronous replicas. This means: 1 in 1 billion chance of simultaneous failure of all 3 copies. Multi-AZ EVS replication provides even higher durability across geographic zones. This level of durability exceeds most regulatory and SLA requirements for enterprise applications.'
    },
    {
      id: 28,
      type: 'multiple-answer',
      question: 'Which sharding algorithms are mentioned as general approaches? (Select all that apply)',
      options: ['Hash algorithms', 'Time-based hash algorithms', 'Range algorithms', 'Modulo algorithms'],
      correct: [0, 1],
      explanation: 'Primary sharding algorithms: (1) Hash algorithms - consistent hashing for uniform distribution; (2) Time-based hash - hash on date fields for time-series data with automatic archival; (3) Range-based - assign key ranges to shards (less uniform but enables easier resharding); (4) Modulo - simple key % shard_count (deprecated, poor resharding). Choose based on data distribution patterns and query patterns.'
    },
    {
      id: 29,
      type: 'true-false',
      question: 'When using DRS to migrate from other distributed databases to DDM, the source should be connected to the compute layer.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. DRS migration topology: Source (distributed DB storage layer) → DRS → DDM destination (compute layer). Source connects to storage layer because it contains actual data and binary logs needed for replication. DDM destination receives transformed data through its query interface. Incorrect connection bypasses replication safeguards and risks data loss.'
    },
    {
      id: 30,
      type: 'multiple-choice',
      question: 'If there are 50 million or more data records, what is the recommended maximum number of records in a single table?',
      options: ['5 million', '10 million', '20 million', '50 million'],
      correct: [1],
      explanation: 'Maximum 10 million records per table is optimal for: fast index lookups (B-tree remains efficient), quick backups/restores, reasonable query response times. At 50M+ records: table scans become slow, index maintenance overhead increases, memory pressure on buffer pools rises. Implement sharding when approaching this limit to maintain sub-second query latency.'
    },
    {
      id: 31,
      type: 'multiple-answer',
      question: 'What are the phases in the OMS migration process? (Select all that apply)',
      options: ['Migration preparations', 'Migration implementation plan', 'Drill and emergency plan', 'Marketing review', 'Migration assurance'],
      correct: [0, 1, 2, 4],
      explanation: 'OMS migration lifecycle: (1) Preparations - assess data, plan infrastructure, establish network connectivity; (2) Implementation plan - detail cutover steps, rollback procedures, resource allocation; (3) Drill - conduct dry-run with production data to validate all steps; (4) Assurance - post-migration validation, checksums, application testing. "Marketing review" is non-technical. Rigorous phases reduce production incidents.'
    },
    {
      id: 32,
      type: 'true-false',
      question: 'MySQL migration should always select the standby database as the migration source in a DRS task.',
      options: ['True', 'False'],
      correct: [1],
      explanation: 'False. Always use the primary database as DRS source because: standby replicas may have delayed/corrupted binary logs, replication lag could miss recent transactions, or log rotation could lose data. Only exception: when explicitly authorized for read-only historical migration. Use primary for guaranteed consistency and completeness.'
    },
    {
      id: 33,
      type: 'multiple-choice',
      question: 'In the database migration drill process, what should be done FIRST?',
      options: ['Stop applications on migration source', 'Revoke write permissions', 'Grant write permissions on Huawei Cloud', 'Monitor source databases'],
      correct: [1],
      explanation: 'First drill step: Revoke write permissions on source database. This ensures: (1) In-flight transactions complete, (2) Final snapshot captured for comparison, (3) Application points to destination, (4) Validates readiness for actual cutover. Only after confirming destination works correctly do you grant write permissions to new system. This staged approach minimizes actual downtime during production cutover.'
    },
    {
      id: 34,
      type: 'multiple-answer',
      question: 'Which storage services are mentioned for Huawei Cloud? (Select all that apply)',
      options: ['OBS', 'SFS', 'EVS', 'EBS', 'NAS'],
      correct: [0, 1, 2],
      explanation: 'Huawei Cloud offers three storage tiers: (1) OBS - object storage for large files/backups/archives; (2) SFS - shared NFS file storage for multi-VM access; (3) EVS - block storage for databases/high-IOPS workloads. EBS is AWS-specific, NAS is on-premises. Choose based on: data structure, access patterns, performance requirements, cost targets.'
    },
    {
      id: 35,
      type: 'true-false',
      question: 'OMS automatically restores archive data and migrates it to destination buckets.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. OMS intelligently handles archived/cold-tier data by: automatically transitioning to standard tier, migrating to destination, then re-archiving if needed. This eliminates manual restoration overhead. Cost implications: storage class changes incur fees; plan accordingly. Useful for migrating entire S3 buckets with mixed storage tiers.'
    },
    {
      id: 36,
      type: 'multiple-choice',
      question: 'What is the typical project completion timeline from project initiation to acceptance?',
      options: ['120 days', '140 days', '160 days', '180 days'],
      correct: [2],
      explanation: 'Standard migration timeline: 160 days from initiation to full acceptance. Breakdown: Discovery/assessment (Days 0-20), Design/planning (20-40), Testing/UAT (40-100), Staging/dry-runs (100-140), Production cutover (140-160). This phased approach accommodates stakeholder reviews, fixes, and quality assurance. Aggressive timelines increase risk; allow buffer for issues.'
    },
    {
      id: 37,
      type: 'multiple-answer',
      question: 'What information should be surveyed about the source database? (Select all that apply)',
      options: ['Source construction', 'Migration scope', 'Sharding scheme', 'Data volume', 'Marketing strategy'],
      correct: [0, 1, 2, 3],
      explanation: 'Comprehensive database survey must capture: (1) Source construction - current version, components, dependencies; (2) Migration scope - what fully/partially/not migrates; (3) Sharding scheme - current distribution, key selection logic; (4) Data volume - size, growth rate, backup windows. Also gather: resource utilization, SQL patterns, dependencies, RTO/RPO requirements, compliance needs. "Marketing strategy" is irrelevant to technical planning.'
    },
    {
      id: 38,
      type: 'true-false',
      question: 'In horizontal sharding, a sharded table has full data distributed across database shards of multiple MySQL instances.',
      options: ['True', 'False'],
      correct: [0],
      explanation: 'True. Horizontal sharding partitions table rows across multiple database instances using a shard key: row-by-row distribution ensures no single instance contains full table. Example: user_id % 4 distributes users across 4 shards. Benefits: parallel queries, linear scalability. Challenges: cross-shard joins, distributed transactions, resharding complexity.'
    },
    {
      id: 39,
      type: 'multiple-choice',
      question: 'For migrating NAS to Huawei Cloud SFS, which tools are mentioned for data migration?',
      options: ['DRS only', 'rsync, rclone, or scp', 'OMS only', 'FTP only'],
      correct: [1],
      explanation: 'File system migration tools: (1) rsync - incremental sync with bandwidth optimization, best for Linux; (2) rclone - cloud-native tool supporting multiple backends, excellent for large-scale; (3) scp - simple but slower, good for smaller datasets. Best practice: use rsync initially, then rclone for ongoing sync, validate checksums. Avoid FTP (no integrity checks, slow). Plan for 24+ hour migrations depending on data volume.'
    },
    {
      id: 40,
      type: 'multiple-answer',
      question: 'What are the main advantages of using distributed architecture with sharding? (Select all that apply)',
      options: ['Higher write performance', 'Shared-nothing architecture', 'Maximum IOPS higher than single storage', 'Lower storage costs', 'Simplified application code'],
      correct: [0, 1, 2],
      explanation: 'Distributed sharding benefits: (1) Higher write performance - parallel writes across shards vs single database bottleneck; (2) Shared-nothing - independence prevents cascading failures; (3) IOPS scaling - N shards = ~N× IOPS. Trade-offs: "Lower storage costs" is misleading (more instances = higher cost); "Simplified code" is false (complex shard routing logic). Distributed systems require careful design but deliver massive scalability.'
    }
  ];

  useEffect(() => {
    if (quizStarted && !timeStarted) {
      setTimeStarted(Date.now());
    }
  }, [quizStarted, timeStarted]);

  useEffect(() => {
    if (quizStarted && timeStarted && !showResult) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - timeStarted) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quizStarted, timeStarted, showResult]);

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

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;

    const question = questions[currentQuestion];
    
    if (question.type === 'multiple-answer') {
      const newAnswers = selectedAnswers.includes(answerIndex)
        ? selectedAnswers.filter(a => a !== answerIndex)
        : [...selectedAnswers, answerIndex];
      setSelectedAnswers(newAnswers);
    } else {
      setSelectedAnswers([answerIndex]);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswers.length === 0) return;

    const question = questions[currentQuestion];
    const isCorrect = 
      selectedAnswers.length === question.correct.length &&
      selectedAnswers.every(ans => question.correct.includes(ans));

    if (isCorrect) {
      setScore(score + 1);
    }

    setResults([...results, {
      question: question.question,
      correct: isCorrect,
      userAnswers: selectedAnswers,
      correctAnswers: question.correct,
      explanation: question.explanation
    }]);

    setAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswers([]);
      setAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResult(false);
    setScore(0);
    setAnswered(false);
    setResults([]);
    setTimeStarted(null);
    setTimeSpent(0);
    setQuizStarted(false);
  };

  const getAnswerClass = (index: number) => {
    if (!answered) {
      return selectedAnswers.includes(index) 
        ? 'bg-blue-100 border-blue-500' 
        : 'bg-white hover:bg-gray-50';
    }

    const question = questions[currentQuestion];
    const isCorrectAnswer = question.correct.includes(index);
    const isSelected = selectedAnswers.includes(index);

    if (isCorrectAnswer) {
      return 'bg-green-100 border-green-500';
    }
    if (isSelected && !isCorrectAnswer) {
      return 'bg-red-100 border-red-500';
    }
    return 'bg-white';
  };

  if (!quizStarted) {
    return (
      <div className="dashboard-container">
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
                onClick={() => navigate('/quizzes')}
                style={{ marginLeft: '8px', padding: '8px' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="nav-logo">
                <div className="logo-icon">Q</div>
                <span className="nav-title">QuizHub</span>
              </div>
            </div>

            <div className="nav-right">
              <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search quizzes..." 
                />
              </div>
              <div className="divider-line"></div>
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
                    <span style={{ color: '#4285F4', fontWeight: '700' }}>
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
          <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
            <div className="sidebar-items">
              <a href="/dashboard" className="sidebar-item">
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </a>
              <a href="/quizzes" className="sidebar-item active">
                <Search size={20} />
                <span>My Quizzes</span>
              </a>
              <a href="/analytics" className="sidebar-item">
                <BarChart3 size={20} />
                <span>Performance</span>
              </a>
            </div>
          </aside>

          <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              padding: '40px 20px',
              background: 'linear-gradient(135deg, var(--color-background) 0%, rgba(233, 69, 96, 0.03) 100%)',
            }}>
              <style>{quizStyles}</style>
              
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '20px',
                padding: '48px',
                maxWidth: '650px',
                width: '100%',
                textAlign: 'center',
                border: '2px solid var(--color-border)',
                boxShadow: '0 20px 60px rgba(233, 69, 96, 0.1)',
                animation: 'slideInUp 0.6s ease-out',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(233, 69, 96, 0.1)',
                  marginBottom: '24px',
                }}>
                  <Award size={44} style={{ color: '#e94560' }} />
                </div>
                
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: 'var(--color-text)',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #e94560 0%, #ff6b7a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Database Migration Quiz
                </h1>
                
                <p style={{
                  fontSize: '16px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '12px',
                }}>
                  Chapter 6 & 7
                </p>
                
                <p style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '36px',
                  fontWeight: '500',
                }}>
                  Advanced Migration Strategies & Database Architecture
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  marginBottom: '36px',
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                  }}>
                    <Zap size={24} style={{ color: '#e94560', margin: '0 auto 8px' }} />
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
                      QUESTIONS
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#e94560' }}>
                      {questions.length}
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                  }}>
                    <Clock size={24} style={{ color: '#f59e0b', margin: '0 auto 8px' }} />
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
                      DURATION
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                      45 min
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                  }}>
                    <Target size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
                      PASS SCORE
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                      70%
                    </p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  border: '1px solid var(--color-border)',
                }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '10px',
                  }}>
                    ✓ What you'll learn:
                  </p>
                  <ul style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    paddingLeft: '20px',
                  }}>
                    <li>Object Storage Migration Service (OMS) & DRS strategies</li>
                    <li>Database sharding and distributed architecture patterns</li>
                    <li>Performance optimization and capacity planning</li>
                    <li>Migration timelines and best practices</li>
                  </ul>
                </div>

                <button
                  onClick={() => setQuizStarted(true)}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    backgroundColor: '#e94560',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(233, 69, 96, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d63548';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(233, 69, 96, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e94560';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(233, 69, 96, 0.3)';
                  }}
                >
                  Start Quiz →
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = ((score / questions.length) * 100).toFixed(1);
    const passed = percentage >= 70;

    return (
      <div className="dashboard-container">
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
                onClick={() => navigate('/quizzes')}
                style={{ marginLeft: '8px', padding: '8px' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="nav-logo">
                <div className="logo-icon">Q</div>
                <span className="nav-title">QuizHub</span>
              </div>
            </div>

            <div className="nav-right">
              <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search quizzes..." 
                />
              </div>
              <div className="divider-line"></div>
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
                    <span style={{ color: '#4285F4', fontWeight: '700' }}>
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
          <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
            <div className="sidebar-items">
              <a href="/dashboard" className="sidebar-item">
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </a>
              <a href="/quizzes" className="sidebar-item active">
                <Search size={20} />
                <span>My Quizzes</span>
              </a>
              <a href="/analytics" className="sidebar-item">
                <BarChart3 size={20} />
                <span>Performance</span>
              </a>
            </div>
          </aside>

          <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
            <div style={{
              padding: '24px',
              maxWidth: '900px',
              margin: '0 auto',
            }}>
              <style>{quizStyles}</style>
              
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '48px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                animation: 'slideInUp 0.6s ease-out',
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '40px',
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    marginBottom: '28px',
                  }}>
                    <Award style={{
                      width: '52px',
                      height: '52px',
                      color: passed ? '#10b981' : '#f59e0b',
                    }} />
                  </div>
                  
                  <h2 style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: 'var(--color-text)',
                    marginBottom: '12px',
                    background: passed 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {passed ? 'Excellent! Quiz Passed!' : 'Quiz Complete'}
                  </h2>
                  
                  <p style={{
                    fontSize: '16px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '16px',
                  }}>
                    You scored <span style={{ fontWeight: '800', color: '#e94560', fontSize: '18px' }}>{score}</span> out of {questions.length} questions
                  </p>
                  
                  <div style={{
                    display: 'inline-block',
                    padding: '24px 40px',
                    borderRadius: '12px',
                    backgroundColor: passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    marginBottom: '24px',
                  }}>
                    <p style={{
                      fontSize: '48px',
                      fontWeight: '900',
                      margin: '0 0 8px 0',
                      color: passed ? '#10b981' : '#f59e0b',
                    }}>
                      {percentage}%
                    </p>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Performance Score
                    </p>
                  </div>
                  
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginTop: '16px',
                    color: passed ? '#10b981' : '#f59e0b',
                  }}>
                    {passed ? '🎉 Congratulations! Keep up the great work!' : '📚 Review the explanations and try again!'}
                  </p>
                </div>

                <div style={{
                  marginBottom: '36px',
                  paddingBottom: '28px',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--color-text)',
                    marginBottom: '18px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '14px',
                  }}>
                    📊 Review Your Answers
                  </h3>
                  <div style={{
                    maxHeight: '500px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingRight: '8px',
                  }}>
                    {results.map((result, idx) => (
                      <div 
                        key={idx}
                        className="quiz-result-enter"
                        style={{
                          padding: '18px',
                          borderRadius: '10px',
                          border: '1px solid',
                          borderColor: result.correct ? '#d1fae5' : '#fee2e2',
                          backgroundColor: result.correct ? '#f0fdf4' : '#fef2f2',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px ' + (result.correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          gap: '14px',
                        }}>
                          <div style={{ flexShrink: 0 }}>
                            {result.correct ? (
                              <CheckCircle size={22} style={{ color: '#10b981' }} />
                            ) : (
                              <XCircle size={22} style={{ color: '#ef4444' }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              fontWeight: '700',
                              color: 'var(--color-text)',
                              marginBottom: '6px',
                              fontSize: '15px',
                            }}>
                              Q{idx + 1}: {result.question}
                            </p>
                            <p style={{
                              fontSize: '13px',
                              color: 'var(--color-text-secondary)',
                              fontStyle: 'italic',
                              lineHeight: '1.5',
                              margin: 0,
                            }}>
                              {result.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}>
                  <button
                    onClick={() => navigate('/quizzes')}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '10px',
                      border: '2px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-background)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Back to Quizzes
                  </button>
                  <button
                    onClick={handleRestart}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#e94560',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(233, 69, 96, 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#d63548';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(233, 69, 96, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#e94560';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 69, 96, 0.25)';
                    }}
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="dashboard-container">
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
              onClick={() => navigate('/quizzes')}
              style={{ marginLeft: '8px', padding: '8px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-logo">
              <div className="logo-icon">Q</div>
              <span className="nav-title">QuizHub</span>
            </div>
          </div>

          <div className="nav-right">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search quizzes..." 
              />
            </div>
            <div className="divider-line"></div>
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
                  <span style={{ color: '#4285F4', fontWeight: '700' }}>
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
        <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
          <div className="sidebar-items">
            <a href="/dashboard" className="sidebar-item">
              <BarChart3 size={20} />
              <span>Dashboard</span>
            </a>
            <a href="/quizzes" className="sidebar-item active">
              <Search size={20} />
              <span>My Quizzes</span>
            </a>
            <a href="/analytics" className="sidebar-item">
              <BarChart3 size={20} />
              <span>Performance</span>
            </a>
          </div>
        </aside>

        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          <div style={{
            padding: '24px',
            maxWidth: '850px',
            margin: '0 auto',
          }}>
            <style>{quizStyles}</style>
            
            <div style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '36px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              animation: 'slideInUp 0.4s ease-out',
            }}>
              {/* Progress Section */}
              <div style={{
                marginBottom: '28px',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#e94560',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                    }}>
                      Score: {score}/{currentQuestion + (answered ? 1 : 0)}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div 
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #e94560 0%, #ff6b7a 100%)',
                      width: `${progress}%`,
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>

              {/* Question Type Badge */}
              <div style={{
                marginBottom: '20px',
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.1) 0%, rgba(233, 69, 96, 0.05) 100%)',
                  color: '#e94560',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  border: '1px solid rgba(233, 69, 96, 0.2)',
                }}>
                  {question.type === 'true-false' ? '✓ TRUE/FALSE' : 
                   question.type === 'multiple-choice' ? '→ MULTIPLE CHOICE' : 
                   '☑ MULTIPLE ANSWERS'}
                </span>
              </div>

              {/* Question */}
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: 'var(--color-text)',
                marginBottom: '28px',
                lineHeight: '1.5',
              }}>
                {question.question}
              </h2>

              {question.type === 'multiple-answer' && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  borderLeft: '3px solid #3b82f6',
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#1e40af',
                    fontWeight: '600',
                    margin: 0,
                  }}>
                    ℹ Select all correct answers
                  </p>
                </div>
              )}

              {/* Options */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '28px',
              }}>
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswers.includes(index);
                  const isCorrect = question.correct.includes(index);
                  const showCorrect = answered && isCorrect;
                  const showIncorrect = answered && isSelected && !isCorrect;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={answered}
                      className="quiz-option-enter"
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px solid',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: answered ? 'not-allowed' : 'pointer',
                        backgroundColor: 'var(--color-background)',
                        borderColor: showCorrect ? '#10b981' :
                                    showIncorrect ? '#ef4444' :
                                    isSelected ? '#3b82f6' : 'var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        if (!answered) {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 69, 96, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!answered) {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: showCorrect || showIncorrect ? '50%' : '6px',
                        border: '2px solid',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        borderColor: showCorrect ? '#10b981' :
                                    showIncorrect ? '#ef4444' :
                                    isSelected ? '#3b82f6' : 'var(--color-border)',
                        backgroundColor: showCorrect ? '#10b981' :
                                        showIncorrect ? '#ef4444' :
                                        isSelected ? '#3b82f6' : 'transparent',
                        transition: 'all 0.3s ease',
                      }}>
                        {showCorrect && <CheckCircle size={16} style={{ color: 'white' }} />}
                        {showIncorrect && <XCircle size={16} style={{ color: 'white' }} />}
                        {isSelected && !answered && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                          }} />
                        )}
                      </div>
                      <span style={{
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        fontSize: '15px',
                      }}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {answered && (
                <div style={{
                  marginBottom: '28px',
                  padding: '16px',
                  backgroundColor: '#eff6ff',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '8px',
                  animation: 'slideInUp 0.4s ease-out',
                }}>
                  <p style={{
                    fontWeight: '700',
                    color: '#1e40af',
                    marginBottom: '8px',
                    fontSize: '14px',
                  }}>
                    💡 Explanation
                  </p>
                  <p style={{
                    color: '#1e3a8a',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: '1.6',
                  }}>
                    {question.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
              }}>
                {!answered ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswers.length === 0}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: selectedAnswers.length === 0 ? 'not-allowed' : 'pointer',
                      backgroundColor: selectedAnswers.length === 0 ? '#e5e7eb' : '#e94560',
                      color: selectedAnswers.length === 0 ? '#9ca3af' : 'white',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedAnswers.length === 0 ? 'none' : '0 4px 12px rgba(233, 69, 96, 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAnswers.length > 0) {
                        e.currentTarget.style.backgroundColor = '#d63548';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(233, 69, 96, 0.35)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAnswers.length > 0) {
                        e.currentTarget.style.backgroundColor = '#e94560';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 69, 96, 0.25)';
                      }
                    }}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#059669';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#10b981';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                    }}
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question →' : 'View Results'}
                  </button>
                )}
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
  );
};
