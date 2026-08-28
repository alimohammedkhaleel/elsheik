import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import logoImg from '../../assets/images/logo/logo.png';
import './Presentation.css';

interface PresentationProps {
  onFinish: () => void;
}

export const Presentation: React.FC<PresentationProps> = ({ onFinish }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();

    // Initial setup: Path is drawn hidden
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
    });

    const masterTl = gsap.timeline({
      onComplete: () => {
        onFinish();
      },
    });

    // Step 1: Brush stroke sweeps in
    masterTl.to(path, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: 'power2.inOut',
    });

    // Step 2: Logo and title appear with gold elegance
    if (logoRef.current) {
      masterTl.fromTo(
        logoRef.current,
        { opacity: 0, scale: 0.88, filter: 'blur(6px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' },
        '-=0.5'
      );

      // Moment of presentation showcase
      masterTl.to({}, { duration: 1.2 });

      // Step 3: Logo disappears
      masterTl.to(logoRef.current, {
        opacity: 0,
        scale: 1.04,
        filter: 'blur(4px)',
        duration: 0.5,
        ease: 'power2.in',
      });
    }

    // Step 4: Brush sweeps away revealing the app
    masterTl.to(path, {
      strokeDashoffset: -length,
      duration: 1.2,
      ease: 'power2.inOut',
    });

    return () => {
      masterTl.kill();
    };
  }, [onFinish]);

  return (
    <div ref={containerRef} className="presentation-container">
      {/* SVG Brush Mask Canvas */}
      <svg
        className="presentation-svg-canvas"
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <mask id="sheikhBrushMask">
            <path
              ref={pathRef}
              d="M 100 -200 L -100 1280 L 400 -200 L 200 1280 L 700 -200 L 500 1280 L 1000 -200 L 800 1280 L 1300 -200 L 1100 1280 L 1600 -200 L 1400 1280 L 1900 -200 L 1700 1280 L 2200 -200 L 2000 1280"
              fill="none"
              stroke="white"
              strokeWidth="480"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>

        {/* The Dark Canvas Revealed & Wiped by the Brush Mask */}
        <rect
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          fill="#0c0c0d"
          mask="url(#sheikhBrushMask)"
        />
      </svg>

      {/* Centerpiece: Logo and Title */}
      <div ref={logoRef} className="presentation-content">
        <div className="presentation-logo-wrapper">
          <img
            src={logoImg}
            alt="شعار مؤسسة الشيخ"
            className="presentation-logo-image"
          />
        </div>

        <div className="presentation-text-block">
          <h1 className="presentation-brand-title">مؤسسة الشيخ</h1>
          <p className="presentation-system-subtitle">
            نظام إدارة ومتابعة العملاء
          </p>
        </div>
      </div>
    </div>
  );
};
