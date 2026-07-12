import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-header',
  imports: [
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  private readonly router = inject(Router);

  readonly currentUser = signal<CurrentUser>({
    id: 0,
    name: 'Usuário',
    email: '',
  });

  ngOnInit(): void {
    this.loadCurrentUser();
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

  logout(): void {
    localStorage.removeItem('taskflow_access_token');
    localStorage.removeItem('taskflow_user');

    void this.router.navigate(['/login']);
  }
}