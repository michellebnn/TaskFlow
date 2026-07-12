import { Routes } from '@angular/router';

import { Login } from './features/auth/pages/login/login';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { ProjectsList } from './features/projects/pages/projects-list/projects-list';
import { TasksBoard } from './features/tasks/pages/tasks-board/tasks-board';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'dashboard',
    component: Dashboard,
  },
  {
    path: 'projects',
    component: ProjectsList,
  },
  {
    path: 'tasks',
    component: TasksBoard,
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];