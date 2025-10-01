import { cssVar } from '@toeverything/theme';
import { keyframes, style, styleVariants } from '@vanilla-extract/css';

const baseBackdrop = 'rgba(28, 30, 33, 0.92)';

export const container = style({
  position: 'fixed',
  zIndex: 1200,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  pointerEvents: 'none',
  width: 'fit-content',
});

export const containerPosition = styleVariants({
  'bottom-right': {
    bottom: '24px',
    right: '24px',
    alignItems: 'flex-end',
  },
  'bottom-left': {
    bottom: '24px',
    left: '24px',
    alignItems: 'flex-start',
  },
  'top-right': {
    top: '24px',
    right: '24px',
    alignItems: 'flex-end',
  },
  'top-left': {
    top: '24px',
    left: '24px',
    alignItems: 'flex-start',
  },
});

const pulseAnimation = keyframes({
  '0%': {
    transform: 'scale(1)',
    opacity: 1,
  },
  '50%': {
    transform: 'scale(1.08)',
    opacity: 0.84,
  },
  '100%': {
    transform: 'scale(1)',
    opacity: 1,
  },
});

const spinnerRotation = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const indicatorWrapper = style({
  pointerEvents: 'auto',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
});

export const indicatorButton = style({
  position: 'relative',
  width: '56px',
  height: '56px',
  borderRadius: '16px',
  border: '2px solid transparent',
  background: baseBackdrop,
  color: cssVar('--affine-text-primary-color'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease',
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.28)',
  cursor: 'pointer',
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      boxShadow:
        '0 0 0 2px rgba(255, 255, 255, 0.6), 0 12px 24px rgba(0, 0, 0, 0.28)',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&[data-state="idle"]': {
      borderColor: cssVar('--affine-border-color'),
    },
    '&[data-state="listening"]': {
      borderColor: cssVar('--affine-primary-color'),
      background: 'rgba(46, 108, 255, 0.18)',
    },
    '&[data-state="processing"]': {
      borderColor: cssVar('--affine-warning-color'),
      background: 'rgba(245, 166, 35, 0.2)',
    },
    '&[data-state="error"]': {
      borderColor: cssVar('--affine-error-color'),
      background: 'rgba(235, 77, 64, 0.18)',
    },
  },
});

export const icon = style({
  width: '28px',
  height: '28px',
});

export const pulse = style({
  position: 'absolute',
  inset: '-6px',
  borderRadius: '18px',
  border: `2px solid ${cssVar('--affine-primary-color')}`,
  animation: `${pulseAnimation} 1600ms ease-in-out infinite`,
  opacity: 0,
  pointerEvents: 'none',
  selectors: {
    '[data-state="listening"] &': {
      opacity: 1,
    },
  },
});

export const processingSpinner = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '28px',
  height: '28px',
  marginTop: '-14px',
  marginLeft: '-14px',
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.24)',
  borderTopColor: cssVar('--affine-warning-color'),
  opacity: 0,
  animation: `${spinnerRotation} 960ms linear infinite`,
  transition: 'opacity 140ms ease',
  pointerEvents: 'none',
  selectors: {
    '[data-state="processing"] &': {
      opacity: 1,
    },
  },
});

export const statusBadge = style({
  position: 'absolute',
  inset: 'auto 6px 6px auto',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '2px solid rgba(18, 19, 21, 0.6)',
  background: cssVar('--affine-primary-color'),
  selectors: {
    '[data-state="idle"] &': {
      background: cssVar('--affine-border-color'),
    },
    '[data-state="processing"] &': {
      background: cssVar('--affine-warning-color'),
    },
    '[data-state="error"] &': {
      background: cssVar('--affine-error-color'),
    },
  },
});

export const transcriptPanel = style({
  minWidth: '220px',
  maxWidth: '320px',
  borderRadius: '14px',
  padding: '12px 14px',
  background: baseBackdrop,
  color: cssVar('--affine-text-primary-color'),
  fontSize: cssVar('fontXs'),
  lineHeight: 1.5,
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.28)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  pointerEvents: 'auto',
  overflow: 'hidden',
  selectors: {
    '&[data-state="error"]': {
      borderColor: 'rgba(235, 77, 64, 0.6)',
      boxShadow: '0 12px 28px rgba(235, 77, 64, 0.26)',
    },
  },
});

export const transcriptHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  marginBottom: '8px',
  color: cssVar('--affine-text-secondary-color'),
  fontSize: cssVar('fontXs'),
});

export const transcriptText = style({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const errorMessage = style({
  marginTop: '6px',
  color: cssVar('--affine-error-color'),
  fontSize: cssVar('fontXs'),
  fontWeight: 500,
  lineHeight: 1.5,
});

export const confidenceBar = style({
  position: 'relative',
  height: '6px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.12)',
  overflow: 'hidden',
  marginTop: '10px',
});

export const confidenceFill = style({
  height: '100%',
  borderRadius: 'inherit',
  background: cssVar('--affine-primary-color'),
  transition: 'width 200ms ease-out',
});

export const confidenceLabel = style({
  marginTop: '6px',
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
  textAlign: 'right',
});

export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

export const transcriptToggle = style({
  marginTop: '4px',
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-primary-color'),
  cursor: 'pointer',
  pointerEvents: 'auto',
  textDecoration: 'none',
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontWeight: 500,
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${cssVar('--affine-primary-color')}`,
      outlineOffset: '2px',
    },
  },
});
