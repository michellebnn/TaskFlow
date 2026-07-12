import { Component, inject, OnInit, signal } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Header } from '../../../../layout/components/header/header';
import { Sidebar } from '../../../../layout/components/sidebar/sidebar';
import {
  DashboardService,
  DashboardSummary,
} from '../../services/dashboard';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    Sidebar,
    Header,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly currentUser = signal<CurrentUser>({
    id: 0,
    name: 'Usuário',
    email: '',
  });

  readonly summary = signal<DashboardSummary>({
    projects: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  });

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadSummary();
  }

  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem('taskflow_user');

    if (!storedUser) {
      return;
    }

    try {
      this.currentUser.set(JSON.parse(storedUser) as CurrentUser);
    } catch {
      this.currentUser.set({
        id: 0,
        name: 'Usuário',
        email: '',
      });
    }
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Não foi possível carregar os dados do dashboard.',
        );
        this.loading.set(false);
      },
    });
  }
}