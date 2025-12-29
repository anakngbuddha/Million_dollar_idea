import { useEffect, useRef, useState, useCallback } from 'react';

interface QuizProtectionConfig {
  maxViolations?: number;
  onViolation?: (count: number) => void;
  onAutoSubmit?: () => void;
  enabled?: boolean;
  onFullscreenRequested?: () => void;
}

interface QuizProtectionState {
  violations: number;
  isQuizVisible: boolean;
  isInFullscreen: boolean;
  isCursorInside: boolean;
  warningMessage: string;
  isQuizActive: boolean;
}

/**
 * Custom hook to detect quiz cheating attempts including:
 * - Tab/window switching (visibility API)
 * - URL bar/address bar access detection
 * - Cursor leaving quiz container
 * - Auto-submit on violation threshold
 * - Full-screen mode management for quiz
 */
export const useQuizProtection = (
  quizContainerRef: React.RefObject<HTMLDivElement | null>,
  config: QuizProtectionConfig = {}
) => {
  const {
    maxViolations = 5,
    onViolation,
    onAutoSubmit,
    enabled = true,
    onFullscreenRequested,
  } = config;

  const [violations, setViolations] = useState(0);
  const [isQuizVisible, setIsQuizVisible] = useState(true);
  const [isInFullscreen, setIsInFullscreen] = useState(false);
  const [isCursorInside, setIsCursorInside] = useState(true);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const violationsRef = useRef(violations);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  const scheduleNotificationHide = useCallback(() => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  }, []);

  // Handle visibility change (tab switching, minimization)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsQuizVisible(isVisible);

      if (!isVisible) {
        // User switched tabs or minimized - this counts as leaving the page
        setViolations((prev) => {
          const newViolations = prev + 1;
          onViolation?.(newViolations);
          if (newViolations >= maxViolations) {
            onAutoSubmit?.();
          }
          return newViolations;
        });
        setShowNotification(true);
        scheduleNotificationHide();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, maxViolations, onViolation, onAutoSubmit]);

  // Handle full-screen mode
  useEffect(() => {
    if (!enabled || !isQuizActive) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;

      setIsInFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [enabled, isQuizActive]);

  // Handle cursor leaving quiz container
  useEffect(() => {
    if (!enabled || !quizContainerRef.current) return;

    const container = quizContainerRef.current;

    const handleMouseEnter = () => {
      setIsCursorInside(true);
    };

    const handleMouseLeave = () => {
      setIsCursorInside(false);
      setViolations((prev) => {
        const newViolations = prev + 1;
        onViolation?.(newViolations);
        if (newViolations >= maxViolations) {
          onAutoSubmit?.();
        }
        return newViolations;
      });
      setShowNotification(true);
      scheduleNotificationHide();
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, quizContainerRef, maxViolations, onViolation, onAutoSubmit]);

  // Handle keyboard events - detect attempts to access URL bar or dev tools (Ctrl+T, Cmd+T, F12, Ctrl+Shift+I)
  useEffect(() => {
    if (!enabled || !isQuizActive || !isInFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T or Cmd+T - new tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setViolations((prev) => {
          const newViolations = prev + 1;
          onViolation?.(newViolations);
          if (newViolations >= maxViolations) {
            onAutoSubmit?.();
          }
          return newViolations;
        });
        setShowNotification(true);
        scheduleNotificationHide();
        return;
      }

      // F12 or Ctrl+Shift+I - developer tools
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i')) {
        e.preventDefault();
        setViolations((prev) => {
          const newViolations = prev + 1;
          onViolation?.(newViolations);
          if (newViolations >= maxViolations) {
            onAutoSubmit?.();
          }
          return newViolations;
        });
        setShowNotification(true);
        scheduleNotificationHide();
        return;
      }

      // Ctrl+Shift+C or Cmd+Option+I - inspect element
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'j')) {
        e.preventDefault();
        setViolations((prev) => {
          const newViolations = prev + 1;
          onViolation?.(newViolations);
          if (newViolations >= maxViolations) {
            onAutoSubmit?.();
          }
          return newViolations;
        });
        setShowNotification(true);
        scheduleNotificationHide();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, isQuizActive, isInFullscreen, maxViolations, onViolation, onAutoSubmit, scheduleNotificationHide]);

  const getWarningMessage = useCallback(() => {
    const remaining = Math.max(0, maxViolations - violations);
    if (remaining === 0) {
      return 'Auto-submitting quiz...';
    }
    const plural = remaining === 1 ? 'switch' : 'switches';
    return `${remaining} more ${plural} before auto-submit.`;
  }, [violations, maxViolations]);

  // Function to request full-screen for quiz
  const requestFullscreen = useCallback(async () => {
    try {
      const elem = quizContainerRef.current;
      if (!elem) return;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsQuizActive(true);
      setIsInFullscreen(true);
      onFullscreenRequested?.();
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, [quizContainerRef, onFullscreenRequested]);

  // Function to set quiz active state (for hiding nav even after exiting fullscreen)
  const setQuizActive = useCallback((active: boolean) => {
    setIsQuizActive(active);
  }, []);

  const state: QuizProtectionState = {
    violations,
    isQuizVisible,
    isInFullscreen,
    isCursorInside,
    isQuizActive,
    warningMessage: getWarningMessage(),
  };

  return {
    state,
    showNotification,
    resetViolations: () => setViolations(0),
    requestFullscreen,
    setQuizActive,
  };
};
