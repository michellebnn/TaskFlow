import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { Header } from '../../../../layout/components/header/header';
import { Sidebar } from '../../../../layout/components/sidebar/sidebar';
import {
  Project,
  ProjectsService,
} from '../../../projects/services/projects';
import {
  CreateTaskData,
  Task,
  TaskPriority,
  TaskStatus,
  TasksService,
} from '../../services/tasks';

@Component({
  selector: 'app-tasks-board',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    Sidebar,
    Header,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './tasks-board.html',
  styleUrl: './tasks-board.scss',
})
export class TasksBoard implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly projectsService = inject(ProjectsService);
  private readonly formBuilder = inject(FormBuilder);

  readonly tasks = signal<Task[]>([]);
  readonly projects = signal<Project[]>([]);

  readonly loading = signal(true);
  readonly loadingProjects = signal(true);
  readonly saving = signal(false);

  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingTaskId = signal<number | null>(null);

  readonly taskForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required]],
    description: [''],
    projectId: [0, [Validators.required, Validators.min(1)]],
    status: ['TODO' as TaskStatus, [Validators.required]],
    priority: ['MEDIUM' as TaskPriority, [Validators.required]],
    dueDate: [''],
  });

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  openCreateForm(): void {
    this.editingTaskId.set(null);

    this.taskForm.reset({
      title: '',
      description: '',
      projectId: 0,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
    });

    this.showForm.set(true);
  }

  openEditForm(task: Task): void {
    this.editingTaskId.set(task.id);

    this.taskForm.reset({
      title: task.title,
      description: task.description ?? '',
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? task.dueDate.substring(0, 10)
        : '',
    });

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingTaskId.set(null);

    this.taskForm.reset({
      title: '',
      description: '',
      projectId: 0,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
    });
  }

  saveTask(): void {
    if (this.taskForm.invalid || this.saving()) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const formValue = this.taskForm.getRawValue();

    const data: CreateTaskData = {
      title: formValue.title,
      description: formValue.description,
      projectId: formValue.projectId,
      status: formValue.status,
      priority: formValue.priority,
      dueDate: formValue.dueDate || null,
    };

    const taskId = this.editingTaskId();

    const request = taskId
      ? this.tasksService.update(taskId, data)
      : this.tasksService.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadTasks();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          'Não foi possível salvar a tarefa.',
        );
      },
    });
  }

  loadTasks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.tasksService.getAll().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Não foi possível carregar as tarefas.',
        );
        this.loading.set(false);
      },
    });
  }

  deleteTask(task: Task): void {
    const confirmed = confirm(
      `Deseja realmente excluir a tarefa "${task.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.tasksService.delete(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: () => {
        this.errorMessage.set(
          'Não foi possível excluir a tarefa.',
        );
      },
    });
  }

  getStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      TODO: 'A fazer',
      IN_PROGRESS: 'Em andamento',
      DONE: 'Concluída',
    };

    return labels[status];
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta',
    };

    return labels[priority];
  }

  private loadProjects(): void {
    this.loadingProjects.set(true);

    this.projectsService.getAll().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loadingProjects.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Não foi possível carregar os projetos.',
        );
        this.loadingProjects.set(false);
      },
    });
  }
}