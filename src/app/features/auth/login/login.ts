import { Component, inject, signal } from '@angular/core';
import { form, required, submit, FormField } from '@angular/forms/signals';
import { AuthStore } from '../store/auth.store';
import { FormState } from '../../../core/utils/simple-form-model.util';
import { LoginRequest } from '../models/requests/login.request';

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  public authStore = inject(AuthStore);

  // State signal: shape del form. Signal Forms deriva il form da questo stato.
  protected readonly state = signal<FormState<LoginRequest>>({
    username: '',
    password: '',
  });

  // Schema: validazioni dichiarative su path del form.
  protected readonly loginForm = form(this.state, (p) => {
    required(p.username, { message: 'Matricola obbligatoria' });
    required(p.password, { message: 'Password obbligatoria' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.loginForm, async () => {
      const request = this.state();
      this.authStore.login$(request);
    });
  }
}
