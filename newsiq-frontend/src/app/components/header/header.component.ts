import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="dashboard-header">
      <!-- Left: Logo -->
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🌍</span>
          <div class="logo-text">
            <h1>{{ title }}</h1>
            <p class="tagline">Real-time News Intelligence Dashboard</p>
          </div>
        </div>
      </div>

      <!-- Center: Navigation -->
      <nav class="header-center">
        <ul class="nav-menu">
          <li *ngFor="let item of navItems" 
              [class.active]="activeNav === item.id"
              (click)="onNavClick(item.id)">
            <span class="nav-icon">{{ item.icon }}</span>
            {{ item.label }}
          </li>
        </ul>
      </nav>

      <!-- Right: User Controls -->
      <div class="header-right">
        <!-- Search Bar -->
        <div class="search-container">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearch()"
            placeholder="Search news..." 
            class="search-input"
          />
          <button class="search-btn">
            <span class="search-icon">🔍</span>
          </button>
        </div>

        <!-- Notification -->
        <button class="icon-btn notification-btn" (click)="toggleNotifications()">
          <span class="icon">🔔</span>
          <span *ngIf="notificationCount > 0" class="notification-badge">
            {{ notificationCount }}
          </span>
        </button>

        <!-- Settings -->
        <button class="icon-btn" (click)="toggleSettings()">
          <span class="icon">⚙️</span>
        </button>

        <!-- Dark Mode Toggle -->
        <button class="icon-btn" 
                (click)="toggleDarkMode()" 
                [class.active]="darkMode">
          <span class="icon">{{ darkMode ? '☀️' : '🌙' }}</span>
        </button>

        <!-- User Profile -->
        <div class="user-profile">
          <div class="avatar">U</div>
          <div class="user-info">
            <span class="user-name">User</span>
            <span class="user-role">Admin</span>
          </div>
          <button class="dropdown-btn">▼</button>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title = 'NewsPulse 360°';
  @Input() darkMode = false;
  @Output() darkModeToggle = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  
  searchQuery = '';
  notificationCount = 3;
  activeNav = 'globe';
  
  navItems = [
    { id: 'globe', label: 'Globe Explorer', icon: '🌍' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'quiz', label: 'NewsIQ Quiz', icon: '🧠' },
    { id: 'breaking', label: 'Breaking News', icon: '🚨' },
    { id: 'stars', label: 'My Stars', icon: '⭐' }
  ];

  onNavClick(navId: string) {
    this.activeNav = navId;
    console.log('Navigating to:', navId);
    // Add your navigation logic here
  }

  onSearch() {
    this.search.emit(this.searchQuery);
  }

  toggleDarkMode() {
    this.darkModeToggle.emit();
  }

  toggleNotifications() {
    console.log('Toggle notifications');
    this.notificationCount = 0; // Clear notifications when clicked
  }

  toggleSettings() {
    console.log('Toggle settings');
  }
}