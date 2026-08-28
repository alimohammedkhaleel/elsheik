import { Variants, Transition } from 'framer-motion';

export const defaultTransition: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
  exit: { opacity: 0, y: -16, transition: { duration: 0.2 } },
};

export const slideInRtl: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: defaultTransition },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};
