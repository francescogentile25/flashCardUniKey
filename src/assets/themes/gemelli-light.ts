import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
export const GemelliLight = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#e6ecf1',
      100: '#cdd9e3',
      200: '#9bb3c7',
      300: '#6a8dab',
      400: '#37678f',
      500: '#003057',
      600: '#002a4d',
      700: '#002342',
      800: '#001d38',
      900: '#00172d',
      950: '#001225'
    },
    colorScheme: {
      light: {
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1f2937',
          900: '#0f172a',
          950: '#020617'
        },
        focusRing: {
          width: '2px',
          style: 'solid',
          color: '{primary.color}',
          offset: '0px'
        }
      }
    }
  }
});
