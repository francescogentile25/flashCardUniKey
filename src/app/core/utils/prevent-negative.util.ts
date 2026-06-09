export function preventNegative(event: KeyboardEvent) {
  if (event.key === '-' || event.key === 'e' || event.key === 'E') {
    event.preventDefault();
  }
}
