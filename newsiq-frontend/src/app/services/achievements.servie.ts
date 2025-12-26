// services/achievements.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  type: 'reading' | 'accuracy' | 'sharing' | 'streak';
}

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {
  private achievements: Achievement[] = [
    {
      id: 'news_reader',
      name: 'News Reader',
      icon: '📰',
      description: 'Read 10 news articles',
      unlocked: true,
      progress: 10,
      target: 10,
      type: 'reading'
    },
    {
      id: 'accuracy_master',
      name: 'Accuracy Master',
      icon: '🎯',
      description: 'Answer 5 quiz questions correctly',
      unlocked: false,
      progress: 0,
      target: 5,
      type: 'accuracy'
    },
    {
      id: 'share_champion',
      name: 'Share Champion',
      icon: '📤',
      description: 'Share 3 articles',
      unlocked: false,
      progress: 0,
      target: 3,
      type: 'sharing'
    },
    {
      id: 'streak_king',
      name: 'Streak King',
      icon: '🔥',
      description: 'Visit for 7 consecutive days',
      unlocked: false,
      progress: 1,
      target: 7,
      type: 'streak'
    }
  ];

  private achievementsSubject = new BehaviorSubject<Achievement[]>(this.achievements);
  achievements$ = this.achievementsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem('achievements');
    if (saved) {
      this.achievements = JSON.parse(saved);
      this.achievementsSubject.next(this.achievements);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('achievements', JSON.stringify(this.achievements));
  }

  updateAchievement(id: string, progress: number): void {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement) {
      achievement.progress += progress;
      
      if (!achievement.unlocked && achievement.progress >= achievement.target) {
        achievement.unlocked = true;
        this.showNotification(achievement);
      }
      
      this.saveToStorage();
      this.achievementsSubject.next([...this.achievements]);
    }
  }

  private showNotification(achievement: Achievement): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🏆 Achievement Unlocked!', {
        body: `You've unlocked "${achievement.name}"!`,
        icon: '/assets/icons/news-icon.png'
      });
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  getAchievements(): Achievement[] {
    return this.achievements;
  }

  resetAchievements(): void {
    this.achievements = this.achievements.map(a => ({
      ...a,
      unlocked: a.id === 'news_reader', // Keep news reader unlocked
      progress: a.id === 'news_reader' ? 10 : 0
    }));
    this.saveToStorage();
    this.achievementsSubject.next(this.achievements);
  }
}