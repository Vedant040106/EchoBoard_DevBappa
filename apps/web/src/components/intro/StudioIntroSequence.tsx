import React, { useEffect, useState, useRef } from 'react';
import { Logo } from '../brand/Logo.js';

export type IntroStage = 'initial' | 'stage1' | 'stage2' | 'returning' | 'complete';

interface StudioIntroSequenceProps {
  onStageChange: (stage: IntroStage) => void;
}

export const StudioIntroSequence: React.FC<StudioIntroSequenceProps> = ({ onStageChange }) => {
  const [stage, setStage] = useState<IntroStage>('initial');
  const [flipTransform, setFlipTransform] = useState<string>('translate3d(0, 0, 0) scale(1)');
  const [hideCurtain, setHideCurtain] = useState<boolean>(false);
  const [hideSubtitle, setHideSubtitle] = useState<boolean>(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Accessibility: prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Check session storage flag
    const introSeen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('echoboard_intro_seen') === '1';

    if (prefersReducedMotion) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('echoboard_intro_seen', '1');
      }
      onStageChange('complete');
      setStage('complete');
      return;
    }

    if (introSeen) {
      // Returning session: fast 350ms camera glide directly to wall, bypass full curtain
      onStageChange('returning');
      setStage('complete');
      return;
    }

    // 3. First visit or hard refresh: play signature 1.5s orchestrated sequence
    setStage('stage1');
    onStageChange('stage1');

    // Stage 1 -> Stage 2 FLIP Morph at 750ms
    const timerStage2 = setTimeout(() => {
      // Measure resting header logo slot
      const headerLogoEl = document.getElementById('header-devbappa-logo');
      const badgeEl = badgeRef.current;

      if (headerLogoEl && badgeEl) {
        const headerRect = headerLogoEl.getBoundingClientRect();
        const badgeRect = badgeEl.getBoundingClientRect();

        const badgeCenterX = badgeRect.left + badgeRect.width / 2;
        const badgeCenterY = badgeRect.top + badgeRect.height / 2;

        const headerCenterX = headerRect.left + headerRect.width / 2;
        const headerCenterY = headerRect.top + headerRect.height / 2;

        const dx = headerCenterX - badgeCenterX;
        const dy = headerCenterY - badgeCenterY;

        // Target height 28px vs 64px initial logo
        const scale = Math.max(0.2, Math.min(1.0, headerRect.height / 64));

        setFlipTransform(`translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`);
      }

      setHideSubtitle(true);
      setHideCurtain(true);
      setStage('stage2');
      onStageChange('stage2');
    }, 750);

    // Stage 2 completion at 1550ms
    const timerComplete = setTimeout(() => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('echoboard_intro_seen', '1');
      }
      setStage('complete');
      onStageChange('complete');
    }, 1550);

    return () => {
      clearTimeout(timerStage2);
      clearTimeout(timerComplete);
    };
  }, [onStageChange]);

  if (stage === 'complete' || stage === 'initial') {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        pointerEvents: hideCurtain ? 'none' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#162288',
        backgroundImage:
          'radial-gradient(circle at 14% 10%, rgba(255, 242, 223, 0.22) 0%, rgba(22, 34, 136, 0) 52%), radial-gradient(circle at 86% 90%, rgba(10, 14, 60, 0.8) 0%, rgba(22, 34, 136, 0) 55%)',
        opacity: hideCurtain ? 0 : 1,
        transition: 'opacity 750ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Centered DevBappa Studio Badge that FLIP-morphs into header */}
      <div
        ref={badgeRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: flipTransform,
          transformOrigin: 'center center',
          transition: 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        }}
      >
        {/* Tactile 3D Studio Badge Frame */}
        <div
          style={{
            padding: '16px 28px',
            backgroundColor: hideSubtitle ? 'transparent' : 'rgba(32, 28, 92, 0.85)',
            backdropFilter: hideSubtitle ? 'none' : 'blur(16px)',
            WebkitBackdropFilter: hideSubtitle ? 'none' : 'blur(16px)',
            borderRadius: '20px',
            border: hideSubtitle ? 'none' : '2px solid rgba(255, 255, 255, 0.22)',
            borderBottom: hideSubtitle ? 'none' : '6px solid #231b6e',
            boxShadow: hideSubtitle ? 'none' : '0 20px 48px rgba(10, 12, 50, 0.65), 0 0 32px rgba(255, 242, 223, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: stage === 'stage1' ? 'introBadgeAwaken 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none',
            transition: 'background-color 0.3s ease, border 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          <Logo height={64} />
        </div>

        {/* Subtitle ("EchoBoard — Live Feedback Wall") */}
        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            opacity: hideSubtitle ? 0 : 1,
            transform: hideSubtitle ? 'translateY(10px)' : 'translateY(0)',
            transition: 'opacity 300ms ease, transform 300ms ease',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            EchoBoard
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fed7aa',
              marginTop: '4px',
            }}
          >
            Live Feedback Wall &bull; DevBappa Solutions
          </div>
        </div>
      </div>

      <style>{`
        @keyframes introBadgeAwaken {
          0% {
            opacity: 0;
            transform: scale(0.88) perspective(600px) rotateX(8deg);
          }
          100% {
            opacity: 1;
            transform: scale(1.0) perspective(600px) rotateX(0deg);
          }
        }
      `}</style>
    </div>
  );
};
