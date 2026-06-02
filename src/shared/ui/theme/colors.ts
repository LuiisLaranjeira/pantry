export interface Palette {
  bg: {
    default: string;
    surface: string;
    raised: string;
  };
  text: {
    primary: string;
    secondary: string;
    subtle: string;
    muted: string;
    placeholder: string;
    inverse: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
  };
  primary: {
    base: string;
    muted: string;
    soft: string;
    accent: string;
  };
  danger: {
    base: string;
    soft: string;
    text: string;
  };
  warning: {
    base: string;
    soft: string;
    text: string;
  };
  success: {
    base: string;
    soft: string;
  };
  info: {
    base: string;
    soft: string;
  };
  overlay: {
    dim: string;
    modal: string;
  };
}

export const lightPalette: Palette = {
  bg: {
    default: '#F8F9FA',
    surface: '#FFFFFF',
    raised: '#FFFFFF',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#555555',
    subtle: '#666666',
    muted: '#888888',
    placeholder: '#999999',
    inverse: '#FFFFFF',
  },
  border: {
    subtle: '#F0F0F0',
    default: '#E0E0E0',
    strong: '#D0D0D0',
  },
  primary: {
    base: '#2D6A4F',
    muted: '#A8D5BF',
    soft: '#E8F5EF',
    accent: '#52B788',
  },
  danger: {
    base: '#E53935',
    soft: '#FDECEA',
    text: '#C0392B',
  },
  warning: {
    base: '#F4A261',
    soft: '#FFF3CD',
    text: '#856404',
  },
  success: {
    base: '#2D6A4F',
    soft: '#E8F5EF',
  },
  info: {
    base: '#1565C0',
    soft: '#E3F2FD',
  },
  overlay: {
    dim: 'rgba(0, 0, 0, 0.5)',
    modal: 'rgba(0, 0, 0, 0.45)',
  },
};

export const darkPalette: Palette = {
  bg: {
    default: '#0F1419',
    surface: '#1A1F26',
    raised: '#232830',
  },
  text: {
    primary: '#F0F0F0',
    secondary: '#B0B0B0',
    subtle: '#A0A0A0',
    muted: '#808080',
    placeholder: '#606060',
    inverse: '#1A1A1A',
  },
  border: {
    subtle: '#2A2F36',
    default: '#3A3F46',
    strong: '#4A4F56',
  },
  primary: {
    base: '#52B788',
    muted: '#2D6A4F',
    soft: 'rgba(82, 183, 136, 0.15)',
    accent: '#74C69D',
  },
  danger: {
    base: '#FF6B68',
    soft: 'rgba(255, 107, 104, 0.18)',
    text: '#FF8A87',
  },
  warning: {
    base: '#FFB266',
    soft: 'rgba(255, 178, 102, 0.15)',
    text: '#FFCC80',
  },
  success: {
    base: '#52B788',
    soft: 'rgba(82, 183, 136, 0.15)',
  },
  info: {
    base: '#64B5F6',
    soft: 'rgba(100, 181, 246, 0.15)',
  },
  overlay: {
    dim: 'rgba(0, 0, 0, 0.7)',
    modal: 'rgba(0, 0, 0, 0.6)',
  },
};
