import gsap from 'gsap';

export interface BrushAnimationOptions {
  pathElement: SVGPathElement;
  contentElement?: HTMLElement | null;
  onStart?: () => void;
  onRevealed?: () => void;
  onFinish?: () => void;
}

/**
 * Creates the signature Brush Mask Wipe Animation using GSAP
 * Inspired by modern brush stroke wipe transitions.
 */
export const createBrushPresentationTimeline = (options: BrushAnimationOptions): gsap.core.Timeline => {
  const { pathElement, contentElement, onRevealed, onFinish } = options;

  const length = pathElement.getTotalLength();

  // Initialize path with full offset (hidden)
  gsap.set(pathElement, {
    strokeDasharray: length,
    strokeDashoffset: length,
  });

  const tl = gsap.timeline();

  // 1. Paint the brush stroke in
  tl.to(pathElement, {
    strokeDashoffset: 0,
    duration: 2.0,
    ease: 'power2.inOut',
    onComplete: () => {
      if (onRevealed) onRevealed();
    },
  });

  // 2. Animate the logo and text content smoothly
  if (contentElement) {
    tl.fromTo(
      contentElement,
      { opacity: 0, scale: 0.88, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.4)' },
      '-=0.8'
    );

    // Hold moment for impact
    tl.to({}, { duration: 1.2 });

    // 3. Dissolve content before unpainting brush
    tl.to(contentElement, {
      opacity: 0,
      scale: 1.05,
      filter: 'blur(4px)',
      duration: 0.6,
      ease: 'power2.in',
    });
  }

  // 4. Unpaint the brush stroke out to reveal the main app
  tl.to(pathElement, {
    strokeDashoffset: -length,
    duration: 1.6,
    ease: 'power2.inOut',
    onComplete: () => {
      if (onFinish) onFinish();
    },
  });

  return tl;
};
