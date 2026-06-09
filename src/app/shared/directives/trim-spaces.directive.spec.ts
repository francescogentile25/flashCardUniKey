import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TrimSpaces } from './trim-spaces.directive';

@Component({
  standalone: true,
  imports: [TrimSpaces, ReactiveFormsModule, FormsModule],
  template: `
    <input trimSpaces [formControl]="testControl" />
    <textarea trimSpaces [formControl]="textareaControl"></textarea>
  `
})
class TestComponent {
  testControl = new FormControl('');
  textareaControl = new FormControl('');
}

describe('TrimSpaces Directive', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let inputEl: DebugElement;
  let textareaEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('input'));
    textareaEl = fixture.debugElement.query(By.css('textarea'));
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(inputEl).toBeTruthy();
    expect(textareaEl).toBeTruthy();
  });

  describe('input event handling', () => {
    it('should replace multiple consecutive spaces with single space', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = 'hello    world';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('hello world');
    });

    it('should handle multiple spaces in different positions', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = 'hello   there   world';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('hello there world');
    });

    it('should not modify single spaces', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = 'hello world';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('hello world');
    });

    it('should work with textarea', () => {
      const textarea = textareaEl.nativeElement as HTMLTextAreaElement;
      textarea.value = 'line1   line2';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(textarea.value).toBe('line1 line2');
    });
  });

  describe('blur event handling', () => {
    it('should trim leading and trailing spaces on blur', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = '  hello world  ';
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.value).toBe('hello world');
      expect(component.testControl.value).toBe('hello world');
    });

    it('should remove multiple consecutive spaces on blur', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = 'hello    world';
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.value).toBe('hello world');
    });

    it('should clear input if only spaces on blur', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = '     ';
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.value).toBe('');
      expect(component.testControl.value).toBe('');
    });

    it('should handle empty string', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.value).toBe('');
    });

    it('should handle null/undefined values gracefully', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      component.testControl.setValue(null);
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should trim and clean spaces on blur', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = '  hello   world  ';
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.value).toBe('hello world');
    });

    it('should update form control value on blur', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = '  test value  ';
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(component.testControl.value).toBe('test value');
    });

    it('should work with textarea on blur', () => {
      const textarea = textareaEl.nativeElement as HTMLTextAreaElement;
      textarea.value = '  multiline   text  ';
      textarea.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(textarea.value).toBe('multiline text');
      expect(component.textareaControl.value).toBe('multiline text');
    });
  });

  describe('combined input and blur', () => {
    it('should handle input then blur correctly', () => {
      const input = inputEl.nativeElement as HTMLInputElement;

      // Input with multiple spaces
      input.value = 'hello    world';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(input.value).toBe('hello world');

      // Add leading/trailing spaces and blur
      input.value = '  hello world  ';
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(input.value).toBe('hello world');
    });

    it('should maintain form control sync', () => {
      const input = inputEl.nativeElement as HTMLInputElement;

      input.value = '  test    value  ';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.value).toBe('test value');
      expect(component.testControl.value).toBe('test value');
    });
  });

  describe('edge cases', () => {
    it('should handle tabs and other whitespace', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      input.value = 'hello\t\tworld';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('hello world');
    });

    it('should handle newlines in textarea', () => {
      const textarea = textareaEl.nativeElement as HTMLTextAreaElement;
      textarea.value = 'line1\n\n\nline2';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(textarea.value).toBe('line1 line2');
    });

    it('should handle very long strings', () => {
      const input = inputEl.nativeElement as HTMLInputElement;
      const longString = 'word '.repeat(1000);
      input.value = longString;
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.value).toBe(longString.trim());
    });
  });
});
