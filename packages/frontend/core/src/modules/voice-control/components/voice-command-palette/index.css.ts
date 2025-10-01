import { cssVar } from '@toeverything/theme';
import { style, styleVariants } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  width: 'min(780px, 95vw)',
  maxHeight: '75vh',
  background: 'rgba(24, 25, 28, 0.96)',
  backdropFilter: 'blur(12px)',
  borderRadius: '18px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
  padding: '20px 24px',
  gap: '16px',
  color: cssVar('--affine-text-primary-color'),
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const titleRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const title = style({
  fontSize: cssVar('fontLg'),
  fontWeight: 600,
});

export const hint = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
});

export const searchWrapper = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

export const badge = style({
  padding: '2px 8px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
});

export const filterBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

export const filterButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '999px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: cssVar('--affine-text-secondary-color'),
  fontSize: cssVar('fontXs'),
  cursor: 'pointer',
  transition: 'background 140ms ease, border 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.12)',
      color: cssVar('--affine-text-primary-color'),
    },
    '&:focus-visible': {
      outline: `2px solid ${cssVar('--affine-primary-color')}`,
      outlineOffset: '2px',
    },
  },
});

export const filterButtonActive = styleVariants({
  true: {
    borderColor: cssVar('--affine-primary-color'),
    background: 'rgba(46, 108, 255, 0.18)',
    color: cssVar('--affine-text-primary-color'),
  },
  false: {},
});

export const filterCount = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '18px',
  height: '18px',
  borderRadius: '9px',
  background: 'rgba(255, 255, 255, 0.12)',
  paddingInline: '6px',
  fontSize: cssVar('fontXs'),
});

export const content = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 260px)',
  gap: '20px',
  alignItems: 'start',
  '@media': {
    '(max-width: 860px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const resultsColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  minWidth: 0,
});

export const listWrapper = style({
  overflow: 'auto',
  paddingRight: '4px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxHeight: '40vh',
  borderRadius: '14px',
  background: 'rgba(0, 0, 0, 0.12)',
  padding: '12px',
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const sectionHeader = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-tertiary-color'),
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
});

export const commandList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const commandItem = style({
  borderRadius: '12px',
  padding: '10px 12px',
  cursor: 'pointer',
  transition: 'background 140ms ease, transform 140ms ease',
  background: 'transparent',
  color: 'inherit',
  border: '1px solid transparent',
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: '8px',
  textAlign: 'left',
  width: '100%',
  selectors: {
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.08)',
    },
    '&:focus-visible': {
      outline: `2px solid ${cssVar('--affine-primary-color')}`,
      outlineOffset: '2px',
    },
  },
});

export const commandItemActive = styleVariants({
  true: {
    background: 'rgba(46, 108, 255, 0.18)',
    borderColor: cssVar('--affine-primary-color'),
    transform: 'translateY(-1px)',
  },
  false: {},
});

export const commandTitle = style({
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
  color: cssVar('--affine-text-primary-color'),
});

export const commandMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  color: cssVar('--affine-text-secondary-color'),
});

export const shortcut = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
});

export const metaBadge = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-warning-color'),
});

export const emptyState = style({
  padding: '32px 12px',
  textAlign: 'center',
  color: cssVar('--affine-text-tertiary-color'),
  fontSize: cssVar('fontSm'),
});

export const recentList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const recentItem = style({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-secondary-color'),
});

export const details = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  borderRadius: '16px',
  padding: '18px',
  background: 'rgba(18, 19, 23, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  minHeight: '260px',
});

export const detailTitle = style({
  fontSize: cssVar('fontMd'),
  fontWeight: 600,
});

export const detailDescription = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('--affine-text-secondary-color'),
});

export const detailDescriptionMuted = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('--affine-text-tertiary-color'),
});

export const detailTags = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

export const detailTag = style({
  borderRadius: '999px',
  padding: '4px 10px',
  fontSize: cssVar('fontXs'),
  background: 'rgba(255, 255, 255, 0.08)',
  color: cssVar('--affine-text-secondary-color'),
});

export const detailTagAccent = style({
  borderRadius: '999px',
  padding: '4px 10px',
  fontSize: cssVar('fontXs'),
  background: 'rgba(245, 166, 35, 0.16)',
  color: cssVar('--affine-warning-color'),
});

export const detailSectionTitle = style({
  fontSize: cssVar('fontXs'),
  color: cssVar('--affine-text-tertiary-color'),
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

export const detailList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const detailListItem = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('--affine-text-secondary-color'),
});

export const detailListLabel = style({
  fontWeight: 600,
  marginRight: '6px',
  color: cssVar('--affine-text-primary-color'),
});

export const detailsEmpty = style({
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
