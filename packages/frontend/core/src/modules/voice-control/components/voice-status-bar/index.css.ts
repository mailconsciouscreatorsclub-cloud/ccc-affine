import { cssVar } from '@toeverything/theme';
import { keyframes, style } from '@vanilla-extract/css';

const shimmer = keyframes({
  '0%': { transform: 'scaleX(0)' },
  '100%': { transform: 'scaleX(1)' },
});

export const container = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: '16px',
  padding: '14px 18px',
  borderRadius: '16px',
  background: 'rgba(20, 22, 25, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.28)',
  color: cssVar('--affine-text-primary-color'),
  selectors: {
    '&[data-phase="listening"]': {
      borderColor: 'rgba(46, 108, 255, 0.48)',
      boxShadow: '0 14px 30px rgba(46, 108, 255, 0.22)',
    },
    '&[data-phase="processing"]': {
      borderColor: 'rgba(245, 166, 35, 0.5)',
      boxShadow: '0 14px 30px rgba(245, 166, 35, 0.22)',
    },
    '&[data-phase="error"]': {
      borderColor: 'rgba(235, 77, 64, 0.5)',
      boxShadow: '0 14px 30px rgba(235, 77, 64, 0.24)',
    },
  },
});

export const stateIndicator = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const stateLabel = style({
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
});

export const subLabel = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
});

export const microphoneMeter = style({
  position: 'relative',
  width: '130px',
  height: '8px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.12)',
  overflow: 'hidden',
  transition: 'background 160ms ease',
  selectors: {
    '&[data-phase="error"]': {
      background: 'rgba(235, 77, 64, 0.22)',
    },
  },
});

export const microphoneFill = style({
  position: 'absolute',
  inset: 0,
  transformOrigin: 'left center',
  background: cssVar('--affine-primary-color'),
  transition: 'transform 100ms ease-out, background 160ms ease',
  selectors: {
    '[data-phase="processing"] &': {
      background: cssVar('--affine-warning-color'),
    },
    '[data-phase="error"] &': {
      background: cssVar('--affine-error-color'),
    },
  },
});

export const infoColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: 0,
});

export const lastCommand = style({
  fontSize: cssVar('fontSm'),
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

export const statusBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
});

export const controls = style({
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
});

export const toggle = style({
  borderRadius: '12px',
  padding: '8px 14px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'inherit',
  fontSize: cssVar('fontSm'),
  transition: 'background 140ms ease, color 140ms ease, border-color 140ms ease',
  selectors: {
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.12)',
    },
    '&:focus-visible': {
      outline: `2px solid ${cssVar('--affine-primary-color')}`,
      outlineOffset: '2px',
    },
    '&[data-active="true"]': {
      background: cssVar('--affine-primary-color'),
      borderColor: 'transparent',
      color: 'var(--affine-text-on-primary-color, #fff)',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
      background: 'rgba(255, 255, 255, 0.08)',
    },
  },
});

export const settings = style({
  border: 'none',
  background: 'transparent',
  color: cssVar('--affine-text-secondary-color'),
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '8px',
  transition: 'color 140ms ease, background 140ms ease',
  selectors: {
    '&:hover': {
      color: cssVar('--affine-text-primary-color'),
      background: 'rgba(255, 255, 255, 0.08)',
    },
    '&:focus-visible': {
      outline: `2px solid ${cssVar('--affine-primary-color')}`,
      outlineOffset: '2px',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.4,
      background: 'transparent',
    },
  },
});

export const microphoneInactive = style({
  animation: `${shimmer} 2s ease-in-out infinite alternate`,
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
