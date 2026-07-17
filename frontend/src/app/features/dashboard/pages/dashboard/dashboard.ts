import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Header } from '../../../../layout/components/header/header';
import { Sidebar } from '../../../../layout/components/sidebar/sidebar';
import {
  Task,
  TasksService,
} from '../../../tasks/services/tasks';
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
    DatePipe,
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
  private readonly tasksService = inject(TasksService);

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

  readonly recentTasks = signal<Task[]>([]);

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  getStatusLabel(task: Task): string {
    const statusLabels: Record<Task['status'], string> = {
      TODO: 'A fazer',
      IN_PROGRESS: 'Em andamento',
      DONE: 'Concluída',
    };

    return statusLabels[task.status];
  }

  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem('taskflow_user');

    if (!storedUser) {
      return;
    }

    try {
      this.currentUser.set(
        JSON.parse(storedUser) as CurrentUser,
      );
    } catch {
      this.currentUser.set({
        id: 0,
        name: 'Usuário',
        email: '',
      });
    }
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      summary: this.dashboardService.getSummary(),
      tasks: this.tasksService.getAll(),
    }).subscribe({
      next: ({ summary, tasks }) => {
        this.summary.set(summary);

        const recentTasks = [...tasks]
          .sort(
            (firstTask, secondTask) =>
              new Date(secondTask.createdAt).getTime() -
              new Date(firstTask.createdAt).getTime(),
          )
          .slice(0, 5);

        this.recentTasks.set(recentTasks);
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