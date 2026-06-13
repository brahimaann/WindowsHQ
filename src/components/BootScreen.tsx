import React, { useState, useEffect, useRef } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

/* ────────────────────────────────────────────────────────
   Authentic Award BIOS terminal boot sequence.
   Renders INSIDE the CRT screen area (not fullscreen).
   ──────────────────────────────────────────────────────── */

interface TermLine {
  text: string;
  color?: string;
  bold?: boolean;
  parts?: { text: string; color: string }[];
}

const hashBlob =
  'hDRDhEyBFFmFBESAQAQIfPgQEYC0F81IvHPD1E1EgAAQKUCsOwfIwIQQ3ZWEaICPy3g0hEhISIwIhQ1UBIBLgL' +
  'FBAAAAAAAAAAAAAAAAAAA1984AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAExJU1RGAAAAaSU5GT01DUkQLAAAAMTk5M10wMu0AASU0Rw0AABCaWxs1fAvbGZvcmQAREITR1QAAAUZ9';

const LINES: TermLine[] = [
  { text: 'Award Modular BIOS v4.51PG, An Energy Star Ally', color: '#ffffff', bold: true },
  { text: 'Copyright (C) 1984-85, Award Software, Inc.', color: '#aaaaaa' },
  { text: '' },
  { text: '' },
  { text: 'Detecting mouse... OK', parts: [{ text: 'Detecting mouse... ', color: '#aaaaaa' }, { text: 'OK', color: '#55ff55' }] },
  { text: 'Detecting touch support... FAILED', parts: [{ text: 'Detecting touch support... ', color: '#aaaaaa' }, { text: 'FAILED', color: '#ff5555' }] },
  { text: 'Connecting to network... OK', parts: [{ text: 'Connecting to network... ', color: '#aaaaaa' }, { text: 'OK', color: '#55ff55' }] },
  { text: 'Initializing file system... OK', parts: [{ text: 'Initializing file system... ', color: '#aaaaaa' }, { text: 'OK', color: '#55ff55' }] },
  { text: 'Loading system themes... OK', parts: [{ text: 'Loading system themes... ', color: '#aaaaaa' }, { text: 'OK', color: '#55ff55' }] },
  { text: 'Initializing Recycle Bin... OK', parts: [{ text: 'Initializing Recycle Bin... ', color: '#aaaaaa' }, { text: 'OK', color: '#55ff55' }] },
  { text: `Preloading default theme assets... ${hashBlob}`, color: '#55ffff' },
  { text: 'Preloading default theme assets... OK', parts: [{ text: 'Preloading default theme assets... ', color: '#aaaaaa' }, { text: 'OK', color: '#55ff55' }] },
  { text: 'Loading custom applications... OK', parts: [{ text: 'Loading custom applications... ', color: '#aaaaaa' }, { text: 'OK', color: '#55ff55' }] },
];

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [countdownActive, setCountdownActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Print lines one-by-one
  useEffect(() => {
    if (visibleCount >= LINES.length) {
      setCountdownActive(true);
      return;
    }
    const delay = LINES[visibleCount]?.text === '' ? 60 : 120;
    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  // Auto-scroll as lines print
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount]);

  // Countdown after all lines printed
  useEffect(() => {
    if (!countdownActive) return;
    if (countdown <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownActive, onComplete]);

  // Skip on any key / click
  useEffect(() => {
    const skip = () => onComplete();
    window.addEventListener('keydown', skip);
    window.addEventListener('click', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('click', skip);
    };
  }, [onComplete]);

  const renderLine = (line: TermLine, i: number) => {
    if (line.text === '') {
      return <div key={i} style={{ height: '1.1em' }}>&nbsp;</div>;
    }
    if (line.parts) {
      return (
        <div key={i}>
          {line.parts.map((p, j) => (
            <span key={j} style={{ color: p.color }}>{p.text}</span>
          ))}
        </div>
      );
    }
    return (
      <div
        key={i}
        style={{
          color: line.color || '#aaaaaa',
          wordBreak: 'break-all',
        }}
      >
        {line.text}
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <style>{`
        @font-face {
          font-family: 'Fixedsys Excelsior';
          src: url('/font/fixedsys-excelsior/fsex300-webfont.woff') format('woff'),
               url('/font/fixedsys-excelsior/fsex300-webfont.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: block;
        }
        .bios-terminal, .bios-terminal * {
          font-family: 'Fixedsys Excelsior', 'Perfect DOS VGA 437', 'Courier New', monospace !important;
          font-weight: normal !important;
          -webkit-font-smoothing: none !important;
          -moz-osx-font-smoothing: unset !important;
        }
      `}</style>

      {/* Main terminal area */}
      <div
        ref={containerRef}
        className="bios-terminal"
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '8px 12px',
          fontSize: '14px',
          lineHeight: '1.15',
          position: 'relative',
          color: '#aaaaaa',
        }}
      >
        {/* Energy Star logo — top right */}
        <div style={{ position: 'absolute', top: 8, right: 12, textAlign: 'center' }}>
          <svg style={{ width: 100, height: 70 }} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 60,4 L 67,24 L 88,24 L 71,37 L 78,57 L 60,44 L 42,57 L 49,37 L 32,24 L 53,24 Z" stroke="#ffff00" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <path d="M 30,14 A 40,40 0 0,0 74,62" stroke="#00cc00" strokeWidth="2" strokeLinecap="round" fill="none" />
            <text x="60" y="36" fill="#ffff00" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle" fontStyle="italic">energy</text>
          </svg>
          <div style={{ color: '#00cc00', fontSize: '9px', letterSpacing: '0.5px', marginTop: '-4px', fontFamily: 'Arial, sans-serif' }}>
            EPA POLLUTION PREVENTER
          </div>
        </div>

        {/* Printed BIOS lines */}
        {LINES.slice(0, visibleCount).map((line, i) => renderLine(line, i))}

        {/* Countdown prompt */}
        {countdownActive && (
          <div style={{ color: '#ffffff', marginTop: '4px' }}>
            Press any key to continue... {countdown}
          </div>
        )}
      </div>

      {/* Bottom status bar — pinned */}
      <div
        className="bios-terminal"
        style={{
          padding: '4px 12px',
          fontSize: '14px',
          lineHeight: '1.15',
          color: '#888888',
          borderTop: 'none',
        }}
      >
        Press F8 for Startup Menu.
      </div>
    </div>
  );
};

export default BootScreen;
