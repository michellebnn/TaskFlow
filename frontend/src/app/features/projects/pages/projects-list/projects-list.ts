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

import { Header } from '../../../../layout/components/header/header';
import { Sidebar } from '../../../../layout/components/sidebar/sidebar';
import {
  Project,
  ProjectsService,
} from '../../services/projects';

@Component({
  selector: 'app-projects-list',
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
  ],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.scss',
})
export class ProjectsList implements OnInit {
  private readonly projectsService = inject(ProjectsService);
  private readonly formBuilder = inject(FormBuilder);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingProjectId = signal<number | null>(null);

  readonly projectForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  openCreateForm(): void {
    this.editingProjectId.set(null);

    this.projectForm.reset({
      name: '',
      description: '',
    });

    this.showForm.set(true);
  }

  openEditForm(project: Project): void {
    this.editingProjectId.set(project.id);

    this.projectForm.reset({
      name: project.name,
      description: project.description ?? '',
    });

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingProjectId.set(null);

    this.projectForm.reset({
      name: '',
      description: '',
    });
  }

  saveProject(): void {
    if (this.projectForm.invalid || this.saving()) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const formValue = this.projectForm.getRawValue();
    const projectId = this.editingProjectId();

    const request = projectId
      ? this.projectsService.update(projectId, formValue)
      : this.projectsService.create(formValue);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadProjects();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Não foi possível salvar o projeto.');
      },
    });
  }

  deleteProject(project: Project): void {
    const confirmed = confirm(
      `Deseja realmente excluir o projeto "${project.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.projectsService.delete(project.id).subscribe({
      next: () => {
        this.loadProjects();
      },
      error: () => {
        this.errorMessage.set('Não foi possível excluir o projeto.');
      },
    });
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.projectsService.getAll().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar os projetos.');
        this.loading.set(false);
      },
    });
  }
}