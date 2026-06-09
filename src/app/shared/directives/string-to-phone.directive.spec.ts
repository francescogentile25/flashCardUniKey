import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StringToPhone } from './string-to-phone.directive';

@Component({
  standalone: true,
  imports: [StringToPhone],
  template: `<input stringToPhone />`
})
class TestComponent {}

describe('StringToPhone Directive', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let inputEl: DebugElement;
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('input'));
    input = inputEl.nativeElement as HTMLInputElement;
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(inputEl).toBeTruthy();
  });

  describe('input event handling', () => {
    it('should allow numeric input', () => {
      input.value = '1234567890';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('1234567890');
    });

    it('should remove non-numeric characters', () => {
      input.value = 'abc123def456';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('123456');
    });

    it('should limit to 10 characters', () => {
      input.value = '12345678901234';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('1234567890');
      expect(input.value.length).toBe(10);
    });

    it('should remove spaces', () => {
      input.value = '123 456 7890';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('1234567890');
    });

    it('should remove special characters', () => {
      input.value = '123-456-7890';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('1234567890');
    });

    it('should remove parentheses', () => {
      input.value = '(123) 456-7890';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('1234567890');
    });

    it('should handle empty string', () => {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('');
    });

    it('should handle only non-numeric characters', () => {
      input.value = 'abcdefg';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('');
    });

    it('should handle mixed alphanumeric', () => {
      input.value = 'Phone: 555-1234';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('5551234');
    });
  });

  describe('keydown event handling', () => {
    it('should allow backspace key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      inputEl.triggerEventHandler('keydown', event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should allow delete key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      inputEl.triggerEventHandler('keydown', event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should allow tab key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      inputEl.triggerEventHandler('keydown', event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should allow arrow keys', () => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

      keys.forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        inputEl.triggerEventHandler('keydown', event);
        expect(event.defaultPrevented).toBe(false);
      });
    });

    it('should allow home and end keys', () => {
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      inputEl.triggerEventHandler('keydown', homeEvent);
      expect(homeEvent.defaultPrevented).toBe(false);

      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      inputEl.triggerEventHandler('keydown', endEvent);
      expect(endEvent.defaultPrevented).toBe(false);
    });

    it('should allow Ctrl+A', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      inputEl.triggerEventHandler('keydown', event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should allow Ctrl+C', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      inputEl.triggerEventHandler('keydown', event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should allow Ctrl+V', () => {
      const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
      inputEl.triggerEventHandler('keydown', event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should allow Ctrl+X', () => {
      const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true });
      inputEl.triggerEventHandler('keydown', event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should block letter keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      inputEl.triggerEventHandler('keydown', event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block special character keys', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');
      inputEl.triggerEventHandler('keydown', event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric keys', () => {
      for (let i = 0; i <= 9; i++) {
        input.value = '';
        const event = new KeyboardEvent('keydown', { key: i.toString() });
        input.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }
    });
  });

  describe('paste event handling', () => {
    it('should extract numbers from pasted text', () => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text', '123-456-7890');

      const event = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true
      });

      spyOn(event, 'preventDefault');
      input.selectionStart = 0;
      input.selectionEnd = 0;
      input.value = '';

      input.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(input.value).toBe('1234567890');
    });

    it('should limit pasted text to 10 characters', () => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text', '12345678901234567890');

      const event = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true
      });

      input.selectionStart = 0;
      input.selectionEnd = 0;
      input.value = '';

      input.dispatchEvent(event);

      expect(input.value).toBe('1234567890');
      expect(input.value.length).toBe(10);
    });

    it('should remove non-numeric from pasted text', () => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text', 'Phone: (555) 123-4567');

      const event = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true
      });

      input.selectionStart = 0;
      input.selectionEnd = 0;
      input.value = '';

      input.dispatchEvent(event);

      expect(input.value).toBe('5551234567');
    });

    it('should handle paste with no clipboard data', () => {
      const event = new ClipboardEvent('paste', {
        bubbles: true
      });

      spyOn(event, 'preventDefault');
      input.value = '';
      input.selectionStart = 0;
      input.selectionEnd = 0;

      input.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(input.value).toBe('');
    });

    it('should insert pasted text at cursor position', () => {
      input.value = '12345';
      input.selectionStart = 2;
      input.selectionEnd = 2;

      const clipboardData = new DataTransfer();
      clipboardData.setData('text', '999');

      const event = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true
      });

      input.dispatchEvent(event);

      expect(input.value).toBe('12999345');
    });

    it('should replace selected text when pasting', () => {
      input.value = '12345';
      input.selectionStart = 1;
      input.selectionEnd = 4;

      const clipboardData = new DataTransfer();
      clipboardData.setData('text', '999');

      const event = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true
      });

      input.dispatchEvent(event);

      expect(input.value).toBe('19995');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters', () => {
      input.value = '123😀456';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('123456');
    });

    it('should handle leading zeros', () => {
      input.value = '0123456789';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value).toBe('0123456789');
    });

    it('should handle multiple input events', () => {
      input.value = '123';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(input.value).toBe('123');

      input.value = '123456';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(input.value).toBe('123456');

      input.value = '1234567890';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(input.value).toBe('1234567890');
    });
  });
});
