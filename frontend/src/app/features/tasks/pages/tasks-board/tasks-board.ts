import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
} from '@angular/cdk/drag-drop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';

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
    DragDropModule,
    Sidebar,
    Header,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './tasks-board.html',
  styleUrl: './tasks-board.scss',
})
export class TasksBoard implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly projectsService = inject(ProjectsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly tasks = signal<Task[]>([]);
  readonly projects = signal<Project[]>([]);

  readonly searchTerm = signal('');
  readonly selectedProjectId = signal(0);
  readonly selectedStatus = signal<TaskStatus | ''>('');
  readonly selectedPriority = signal<TaskPriority | ''>('');

  readonly loading = signal(true);
  readonly loadingProjects = signal(true);
  readonly saving = signal(false);
  readonly updatingTaskId = signal<number | null>(null);

  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingTaskId = signal<number | null>(null);

  readonly filteredTasks = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const projectId = this.selectedProjectId();
    const status = this.selectedStatus();
    const priority = this.selectedPriority();

    return this.tasks().filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search) ||
        (task.description ?? '').toLowerCase().includes(search);

      const matchesProject =
        projectId === 0 || task.projectId === projectId;

      const matchesStatus =
        !status || task.status === status;

      const matchesPriority =
        !priority || task.priority === priority;

      return (
        matchesSearch &&
        matchesProject &&
        matchesStatus &&
        matchesPriority
      );
    });
  });

  readonly todoTasks = computed(() =>
    this.filteredTasks().filter(
      (task) => task.status === 'TODO',
    ),
  );

  readonly inProgressTasks = computed(() =>
    this.filteredTasks().filter(
      (task) => task.status === 'IN_PROGRESS',
    ),
  );

  readonly doneTasks = computed(() =>
    this.filteredTasks().filter(
      (task) => task.status === 'DONE',
    ),
  );

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

        this.showSuccessMessage(
          taskId
            ? 'Tarefa atualizada com sucesso.'
            : 'Tarefa criada com sucesso.',
        );
      },
      error: () => {
        this.saving.set(false);

        this.showErrorMessage(
          'Não foi possível salvar a tarefa.',
        );
      },
    });
  }

  onTaskDrop(
    event: CdkDragDrop<Task[]>,
    newStatus: TaskStatus,
  ): void {
    const task = event.item.data as Task;

    if (
      task.status === newStatus ||
      this.updatingTaskId() === task.id
    ) {
      return;
    }

    this.updatingTaskId.set(task.id);
    this.errorMessage.set('');

    this.tasksService
      .update(task.id, {
        status: newStatus,
      })
      .subscribe({
        next: (updatedTask) => {
          this.tasks.update((tasks) =>
            tasks.map((currentTask) =>
              currentTask.id === task.id
                ? {
                    ...currentTask,
                    ...updatedTask,
                    status: newStatus,
                  }
                : currentTask,
            ),
          );

          this.updatingTaskId.set(null);

          this.showSuccessMessage(
            'Status da tarefa atualizado com sucesso.',
          );
        },
        error: () => {
          this.updatingTaskId.set(null);

          this.showErrorMessage(
            'Não foi possível alterar o status da tarefa.',
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

        this.showErrorMessage(
          'Não foi possível carregar as tarefas.',
        );
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
        this.tasks.update((tasks) =>
          tasks.filter(
            (currentTask) => currentTask.id !== task.id,
          ),
        );

        this.showSuccessMessage(
          'Tarefa excluída com sucesso.',
        );
      },
      error: () => {
        this.showErrorMessage(
          'Não foi possível excluir a tarefa.',
        );
      },
    });
  }

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  updateProjectFilter(projectId: number): void {
    this.selectedProjectId.set(projectId);
  }

  updateStatusFilter(status: TaskStatus | ''): void {
    this.selectedStatus.set(status);
  }

  updatePriorityFilter(
    priority: TaskPriority | '',
  ): void {
    this.selectedPriority.set(priority);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedProjectId.set(0);
    this.selectedStatus.set('');
    this.selectedPriority.set('');
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

 getDueDateLabel(task: Task): string {
  if (!task.dueDate || task.status === 'DONE') {
    return '';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const diff =
    (dueDate.getTime() - today.getTime()) /
    (1000 * 60 * 60 * 24);

  if (diff < 0) {
    return 'Atrasada';
  }

  if (diff === 0) {
    return 'Vence hoje';
  }

  if (diff <= 3) {
    return 'Próxima';
  }

  return '';
}

getDueDateClass(task: Task): string {
  if (!task.dueDate || task.status === 'DONE') {
    return '';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const diff =
    (dueDate.getTime() - today.getTime()) /
    (1000 * 60 * 60 * 24);

  if (diff < 0) {
    return 'overdue';
  }

  if (diff === 0) {
    return 'today';
  }

  if (diff <= 3) {
    return 'soon';
  }

  return '';
} 

  private loadProjects(): void {
    this.loadingProjects.set(true);

    this.projectsService.getAll().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loadingProjects.set(false);
      },
      error: () => {
        this.loadingProjects.set(false);

        this.showErrorMessage(
          'Não foi possível carregar os projetos.',
        );
      },
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}