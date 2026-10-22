// src/utils/theme.ts

export const C = {
  bg: '#0D1B2A',
  surface: '#162234',
  card: '#1E2E42',
  border: '#243550',
  amber: '#F5A623',
  teal: '#38B2AC',
  red: '#E05555',
  green: '#4CAF50',
  text: '#F0EDE6',
  muted: '#8A9BB0',
  white: '#FFFFFF',
};

export const S = {
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.text,
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: C.muted,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: C.text,
  },
  sectionSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
    marginBottom: 14,
  },
};
