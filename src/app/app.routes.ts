import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/_layout/layout.routes')
      .then(r => r.layoutRoutes)
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  },
];
