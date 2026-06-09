import { ToTitleCasePipe } from './to-title-case.pipe';

describe('ToTitleCasePipe', () => {
  let pipe: ToTitleCasePipe;

  beforeEach(() => {
    pipe = new ToTitleCasePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should convert snake_case to Title Case', () => {
      const result = pipe.transform('user_name');

      expect(result).toBe('User name');
    });

    it('should convert camelCase to Title Case', () => {
      const result = pipe.transform('userName');

      expect(result).toBe('User Name');
    });

    it('should convert PascalCase to Title Case', () => {
      const result = pipe.transform('UserName');

      expect(result).toBe('User Name');
    });

    it('should handle multiple underscores', () => {
      const result = pipe.transform('user___name');

      expect(result).toBe('User name');
    });

    it('should handle mixed camelCase and snake_case', () => {
      const result = pipe.transform('user_firstName');

      expect(result).toBe('User first Name');
    });

    it('should handle consecutive capitals', () => {
      const result = pipe.transform('HTMLParser');

      expect(result).toBe('HTML Parser');
    });

    it('should handle numbers', () => {
      const result = pipe.transform('user123Name');

      expect(result).toBe('User 123 Name');
    });

    it('should handle numbers at the start', () => {
      const result = pipe.transform('123users');

      expect(result).toBe('123users');
    });

    it('should capitalize first letter', () => {
      const result = pipe.transform('hello');

      expect(result).toBe('Hello');
    });

    it('should handle single character', () => {
      const result = pipe.transform('a');

      expect(result).toBe('A');
    });

    it('should handle empty string', () => {
      const result = pipe.transform('');

      expect(result).toBe('');
    });

    it('should handle string with spaces', () => {
      const result = pipe.transform('hello world');

      expect(result).toBe('Hello world');
    });

    it('should handle acronyms', () => {
      const result = pipe.transform('XMLHttpRequest');

      expect(result).toBe('XML Http Request');
    });

    it('should handle complex mixed cases', () => {
      const result = pipe.transform('getHTTPResponseCode');

      expect(result).toBe('Get HTTP Response Code');
    });

    it('should handle numbers with capitals', () => {
      const result = pipe.transform('HTML5Parser');

      expect(result).toBe('HTML 5 Parser');
    });

    it('should handle consecutive numbers', () => {
      const result = pipe.transform('user123Address456');

      expect(result).toBe('User 123 Address 456');
    });

    it('should handle leading underscore', () => {
      const result = pipe.transform('_userName');

      expect(result).toBe('User Name');
    });

    it('should handle trailing underscore', () => {
      const result = pipe.transform('userName_');

      expect(result).toBe('User Name');
    });

    it('should handle complex property names', () => {
      const result = pipe.transform('isHTMLEnabled');

      expect(result).toBe('Is HTML Enabled');
    });

    it('should handle ID suffix', () => {
      const result = pipe.transform('userID');

      expect(result).toBe('User ID');
    });

    it('should handle URL case', () => {
      const result = pipe.transform('baseURL');

      expect(result).toBe('Base URL');
    });

    it('should handle iOS style naming', () => {
      const result = pipe.transform('iOSVersion');

      expect(result).toBe('I OS Version');
    });

    it('should handle API naming', () => {
      const result = pipe.transform('apiKey');

      expect(result).toBe('Api Key');
    });

    it('should preserve single uppercase word', () => {
      const result = pipe.transform('HTTP');

      expect(result).toBe('HTTP');
    });

    it('should handle mixed case with numbers', () => {
      const result = pipe.transform('IPv4Address');

      expect(result).toBe('I Pv 4 Address');
    });
  });
});
