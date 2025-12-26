import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatsCard {
  title: string;
  value: number;
  change: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card">
      <h3 class="stats-title">Live Dashboard Stats</h3>
      
      <div class="stats-grid">
        <div *ngFor="let stat of stats" class="stat-item" [style.border-color]="stat.color">
          <div class="stat-icon" [style.background]="stat.color + '20'">
            <span [style.color]="stat.color">{{ stat.icon }}</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatValue(stat.value) }}</div>
            <div class="stat-title">{{ stat.title }}</div>
            <div class="stat-change" [class.positive]="stat.change >= 0" [class.negative]="stat.change < 0">
              {{ stat.change >= 0 ? '+' : '' }}{{ stat.change }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./stats-card.component.scss']
})
export class StatsCardComponent implements OnInit {
  @Input() metrics: any;

  stats: StatsCard[] = [];

  ngOnInit() {
    this.updateStats();
  }

  private updateStats() {
    this.stats = [
      {
        title: 'Stories Today',
        value: this.metrics?.storiesToday || 1247,
        change: 12,
        icon: '📰',
        color: '#2563eb'
      },
      {
        title: 'Positive Sentiment',
        value: this.metrics?.positiveSentiment || 68,
        change: 5,
        icon: '📈',
        color: '#10b981'
      },
      {
        title: 'Breaking Now',
        value: this.metrics?.breakingNow || 14,
        change: -2,
        icon: '🚨',
        color: '#ef4444'
      },
      {
        title: 'Countries',
        value: this.metrics?.countries || 92,
        change: 0,
        icon: '🌍',
        color: '#8b5cf6'
      }
    ];
  }

  formatValue(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toString();
  }
}