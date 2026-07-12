import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

interface Project {
  id: number;
}

interface Task {
  id: number;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export interface DashboardSummary {
  projects: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  getSummary(): Observable<DashboardSummary> {
    return forkJoin({
      projects: this.http.get<Project[]>(`${this.apiUrl}/projects`),
      tasks: this.http.get<Task[]>(`${this.apiUrl}/tasks`),
    }).pipe(
      map(({ projects, tasks }) => ({
        projects: projects.length,
        pendingTasks: tasks.filter((task) => task.status === 'TODO').length,
        inProgressTasks: tasks.filter(
          (task) => task.status === 'IN_PROGRESS',
        ).length,
        completedTasks: tasks.filter((task) => task.status === 'DONE').length,
      })),
    );
  }
}