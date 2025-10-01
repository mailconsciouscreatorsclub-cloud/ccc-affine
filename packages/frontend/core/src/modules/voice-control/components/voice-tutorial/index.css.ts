import { cssVar } from '@toeverything/theme';
import { keyframes, style, styleVariants } from '@vanilla-extract/css';

const appear = keyframes({
  '0%': { opacity: 0, transform: 'translateY(12px) scale(0.96)' },
  '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
});

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: 'min(600px, 95vw)',
  background: 'rgba(22, 24, 27, 0.96)',
  borderRadius: '24px',
  padding: '28px 32px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
  color: cssVar('--affine-text-primary-color'),
  animation: `${appear} 220ms ease`,
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
});

export const title = style({
  fontSize: cssVar('fontXl'),
  fontWeight: 700,
});

export const subtitle = style({
  marginTop: '4px',
  fontSize: cssVar('fontSm'),
  color: cssVar('--affine-text-secondary-color'),
});

export const stepBadge = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('--affine-text-secondary-color'),
});

export const timelineWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const progressBar = style({
  position: 'relative',
  height: '8px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.12)',
  overflow: 'hidden',
});

export const progressFill = style({
  position: 'absolute',
  inset: 0,
  width: '0%',
  background: cssVar('--affine-primary-color'),
  transition: 'width 220ms ease',
});

export const timeline = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '8px',
});

export const timelineButton = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '4px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '12px',
  borderRadius: '14px',
  width: '100%',
  textAlign: 'left',
  color: cssVar('--affine-text-secondary-color'),
  transition: 'background 160ms ease, border 160ms ease, color 160ms ease',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${cssVar('--affine-primary-color')}`,
      outlineOffset: '2px',
    },
  },
});

const timelineItemBase = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: 'rgba(255, 255, 255, 0.04)',
  transition: 'background 160ms ease, border 160ms ease',
};

export const timelineItem = styleVariants({
  complete: {
    ...timelineItemBase,
    border: '1px solid rgba(46, 184, 120, 0.4)',
    background: 'rgba(46, 184, 120, 0.16)',
  },
  active: {
    ...timelineItemBase,
    border: `1px solid ${cssVar('--affine-primary-color')}`,
    background: 'rgba(46, 108, 255, 0.16)',
  },
  upcoming: {
    ...timelineItemBase,
    selectors: {
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
});

export const timelineButtonVariants = styleVariants({
  complete: {
    color: cssVar('--affine-success-color', '#2eb878'),
  },
  active: {
    color: cssVar('--affine-text-primary-color'),
  },
  upcoming: {
    color: cssVar('--affine-text-secondary-color'),
  },
});

export const timelineIndex = style({
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: cssVar('fontXs'),
  background: 'rgba(255, 255, 255, 0.12)',
});

export const timelineTitle = style({
  fontSize: cssVar('fontSm'),
  color: 'inherit',
});

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const stepTitle = style({
  fontSize: cssVar('fontLg'),
  fontWeight: 600,
});

export const stepDescription = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('--affine-text-secondary-color'),
  lineHeight: 1.6,
});

export const stepHint = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-tertiary-color'),
});

export const commandCard = style({
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
});

export const commandLabel = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
});

export const commandText = style({
  fontFamily: 'var(--affine-code-font, "JetBrains Mono", monospace)',
  fontSize: cssVar('fontSm'),
});

export const practiceStatus = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-tertiary-color'),
});

export const footer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const footerActions = style({
  display: 'flex',
  gap: '12px',
});

const celebration = keyframes({
  '0%': { transform: 'scale(0.8)', opacity: 0 },
  '50%': { transform: 'scale(1.03)', opacity: 1 },
  '100%': { transform: 'scale(1)', opacity: 1 },
});

export const completionCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  alignItems: 'center',
  textAlign: 'center',
  animation: `${celebration} 240ms ease`,
});

export const completionTitle = style({
  fontSize: cssVar('fontLg'),
  fontWeight: 700,
});

export const completionSubtitle = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('--affine-text-secondary-color'),
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
