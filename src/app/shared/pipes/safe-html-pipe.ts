import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(html: string | undefined, sanitize: boolean = true): any {
    if (!html) {
      return undefined;
    }

    // If sanitize is false, bypass security - use with caution!
    if (!sanitize) {
      return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    // If sanitize is true, sanitize the HTML (Angular's default behavior)
    return this.sanitizer.sanitize(SecurityContext.HTML, html);
  }

}
