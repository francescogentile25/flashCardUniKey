import { Routes } from "@angular/router";
import { loginGuard } from "../../core/guards/login.guard";

export const layoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./main/main')
      .then(c => c.Main),
    children: [
      {
        path: '',
        loadComponent: () => import('./../flashcards/flashcards-home/flashcards-home')
          .then(c => c.FlashcardsHome)
      },
      {
        path: 'new',
        loadComponent: () => import('./../flashcards/flashcard-create/flashcard-create')
          .then(c => c.FlashcardCreate)
      },
      {
        path: 'login',
        canActivate: [loginGuard],
        loadComponent: () => import('./../auth/login/login')
          .then(c => c.Login)
      }
    ]
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  },
]
