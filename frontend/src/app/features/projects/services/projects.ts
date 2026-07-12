import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/projects';

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  create(data: {
    name: string;
    description: string;
  }): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, data);
  }

  update(
    id: number,
    data: {
      name: string;
      description: string;
    },
  ): Observable<Project> {
    return this.http.put<Project>(
      `${this.apiUrl}/${id}`,
      data,
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${id}`,
    );
  }
}