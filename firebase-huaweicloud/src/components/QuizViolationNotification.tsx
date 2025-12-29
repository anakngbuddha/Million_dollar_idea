import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './QuizViolationNotification.css';

interface QuizViolationNotificationProps {
  show: boolean;
  message: string;
  violations: number;
  maxViolations: number;
}

export const QuizViolationNotification: React.FC<QuizViolationNotificationProps> = ({
  show,
  message,
  violations,
  maxViolations,
}) => {
  if (!show) return null;

  const isWarning = violations < maxViolations;
  const isCritical = violations >= maxViolations - 1 && violations < maxViolations;

  return (
    <div
      className={`quiz-violation-notification ${
        isCritical
          ? 'critical'
          : isWarning
            ? 'warning'
            : 'auto-submit'
      }`}
    >
      <div className="violation-content">
        <AlertTriangle size={20} />
        <div className="violation-text">
          <p className="violation-message">{message}</p>
          <p className="violation-counter">
            Violations: {violations}/{maxViolations}
          </p>
        </div>
      </div>
      <div className="violation-progress">
        <div
          className="violation-bar"
          style={{
            width: `${(violations / maxViolations) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
