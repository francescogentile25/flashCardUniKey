import { definePreset } from '@primeuix/themes';
import { GemelliLight } from "./gemelli-light";

export const GemelliDark = definePreset(GemelliLight, {
  semantic: {
    colorScheme: {
      dark: {
        surface: {
          0:   '#18191a',
          50:  '#18191a',
          100: '#1d1e20',
          200: '#242526',
          300: '#2b2c2e',
          400: '#3a3b3c',
          500: '#4b4c4d',
          600: '#5c5d5e',
          700: '#6d6e6f',
          800: '#7e7f80',
          900: '#8f9091',
          950: '#a0a1a2'
        },
        content: {
          color:     '#e4e6eb',
          weakColor: '#b0b3b8'
        },
        focusRing: {
          width: '2px',
          style: 'solid',
          color: '{primary.400}',
          offset: '0px'
        }
      }
    }
  }
});
