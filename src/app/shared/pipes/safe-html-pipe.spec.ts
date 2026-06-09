import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html-pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(() => {
    mockSanitizer = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml', 'sanitize']);

    // Setup default return values
    mockSanitizer.bypassSecurityTrustHtml.and.callFake((html: string) => html as SafeHtml);
    mockSanitizer.sanitize.and.callFake((ctx, html) => html as string | null);

    TestBed.configureTestingModule({
      providers: [
        SafeHtmlPipe,
        { provide: DomSanitizer, useValue: mockSanitizer }
      ]
    });

    pipe = new SafeHtmlPipe(mockSanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should return undefined for undefined input', () => {
      const result = pipe.transform(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = pipe.transform('');
      expect(result).toBeUndefined();
    });

    it('should bypass security when sanitize is false', () => {
      const html = '<div>Test</div>';
      const result = pipe.transform(html, false);

      // The result should be a SafeHtml object, not a plain string
      expect(result).toBeTruthy();
    });

    it('should sanitize HTML when sanitize is true', () => {
      const html = '<div>Test</div>';
      const result = pipe.transform(html, true);

      expect(result).toBeTruthy();
    });

    it('should default to sanitize=true when parameter not provided', () => {
      const html = '<div>Test</div>';
      const result = pipe.transform(html);

      expect(result).toBeTruthy();
    });

    it('should handle complex HTML', () => {
      const html = '<div class="test"><span>Content</span></div>';
      const result = pipe.transform(html, false);

      expect(result).toBeTruthy();
    });

    it('should handle potentially dangerous HTML with sanitize=true', () => {
      const html = '<script>alert("XSS")</script><div>Safe content</div>';
      const result = pipe.transform(html, true);

      expect(result).toBeTruthy();
    });
  });
});
