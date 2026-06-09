import { AsBoolPipe } from './as-bool-pipe';

describe('AsBoolPipe', () => {
  let pipe: AsBoolPipe;

  beforeEach(() => {
    pipe = new AsBoolPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should return true for boolean true', () => {
      expect(pipe.transform(true)).toBe(true);
    });

    it('should return false for boolean false', () => {
      expect(pipe.transform(false)).toBe(false);
    });

    it('should return true for number 1', () => {
      expect(pipe.transform(1)).toBe(true);
    });

    it('should return false for number 0', () => {
      expect(pipe.transform(0)).toBe(false);
    });

    it('should return false for number 2', () => {
      expect(pipe.transform(2)).toBe(false);
    });

    it('should return true for string "true" (lowercase)', () => {
      expect(pipe.transform('true')).toBe(true);
    });

    it('should return true for string "TRUE" (uppercase)', () => {
      expect(pipe.transform('TRUE')).toBe(true);
    });

    it('should return true for string "True" (mixed case)', () => {
      expect(pipe.transform('True')).toBe(true);
    });

    it('should return true for string "1"', () => {
      expect(pipe.transform('1')).toBe(true);
    });

    it('should return false for string "0"', () => {
      expect(pipe.transform('0')).toBe(false);
    });

    it('should return false for string "false"', () => {
      expect(pipe.transform('false')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(pipe.transform('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(pipe.transform(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(pipe.transform(undefined)).toBe(false);
    });

    it('should return false for random string', () => {
      expect(pipe.transform('random')).toBe(false);
    });

    it('should handle whitespace in string "true"', () => {
      expect(pipe.transform('  true  ')).toBe(true);
    });

    it('should handle whitespace in string "1"', () => {
      expect(pipe.transform('  1  ')).toBe(true);
    });

    it('should return false for objects', () => {
      expect(pipe.transform({})).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(pipe.transform([])).toBe(false);
    });
  });
});
