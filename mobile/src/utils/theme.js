export const colors = {
  bg:       '#0a0a0f',
  surface1: '#12121a',
  surface2: '#1a1a24',
  surface3: '#22222e',
  border:   'rgba(255,255,255,0.07)',
  borderSoft:'rgba(255,255,255,0.04)',
  orange:   '#f97316',
  orangeLight:'#fb923c',
  violet:   '#8b5cf6',
  violetLight:'#a78bfa',
  white:    '#ffffff',
  gray1:    '#e5e7eb',
  gray2:    '#9ca3af',
  gray3:    '#6b7280',
  gray4:    '#374151',
  red:      '#f87171',
  green:    '#34d399',
};

export const s = {
  // text
  textXs:   { fontSize: 11, color: colors.gray3 },
  textSm:   { fontSize: 13, color: colors.gray2 },
  textBase: { fontSize: 15, color: colors.gray1 },
  textBold: { fontSize: 15, fontWeight: '700', color: colors.white },
  heading:  { fontSize: 18, fontWeight: '800', color: colors.white },
  // layout
  row:      { flexDirection: 'row', alignItems: 'center' },
  flex1:    { flex: 1 },
  center:   { alignItems: 'center', justifyContent: 'center' },
  // card
  card: {
    backgroundColor: colors.surface1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // input
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.white,
    fontSize: 15,
  },
};
