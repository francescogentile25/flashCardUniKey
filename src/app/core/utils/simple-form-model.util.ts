import { WritableSignal } from '@angular/core';

/**
 * Tipo di utilità per lo stato iniziale di un form basato su Signal Forms.
 *
 * Signal Forms (Angular 21) derivano il form da un signal che contiene lo stato completo.
 * Questo helper serve a esprimere in modo esplicito la "shape" del signal di stato
 * quando il tipo del modello è complesso — `signal<FormState<LoginRequest>>({...})`.
 *
 * Nota: Signal Forms è API EXPERIMENTAL in Angular 21. L'API può cambiare in minor release.
 *
 * @example
 * import { signal } from '@angular/core';
 * import { form, required } from '@angular/forms/signals';
 *
 * type Model = { username: string; password: string };
 * const state = signal<FormState<Model>>({ username: '', password: '' });
 * const f = form(state, (p) => {
 *   required(p.username);
 *   required(p.password);
 * });
 */
export type FormState<T> = {
  [P in keyof T]: T[P];
};

/**
 * Alias legacy mantenuto per retro-compatibilità con codice Reactive Forms residuo.
 *
 * @deprecated Usa Signal Forms (`@angular/forms/signals`). Mantieni questo solo se
 * devi coesistere con codice esistente che non è ancora stato migrato.
 */
export type SimpleFormModel<T> = FormState<T>;

/**
 * Typing helper: estrae il tipo dello state signal da un form().
 * Utile quando devi passare il form come prop tipizzata.
 */
export type FormStateSignal<T> = WritableSignal<FormState<T>>;
