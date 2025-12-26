// src/app/services/news.services.ts - CORRECTED VERSION
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, Subscription, interval } from 'rxjs'; // ADDED 'interval' here
import { map, tap, catchError } from 'rxjs/operators';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  source: { name: string; id: string };
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
  image?: string;
  author?: string;
  coordinates?: { lat: number; lng: number };
  content?: string;
  sourceType?: string;
}

export interface DashboardMetrics {
  storiesToday: number;
  positiveSentiment: number;
  breakingNow: number;
  countries: number;
  activeStories: number;
  lastUpdated: Date;
  breakingCount: number;
}

// Interface for API response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService implements OnDestroy {
  private apiUrl = 'http://localhost:3000/api'; // Your Next.js backend
  private refreshSubscription?: Subscription;

  private newsSubject = new BehaviorSubject<NewsArticle[]>([]);
  private metricsSubject = new BehaviorSubject<any>({
    shelves: { count: '1.2k', change: '+12%' },
    positive: { count: '68', change: '+5%' },
    breaking: { count: '14', change: '+9%' },
    counts: { count: '92', change: '+9%' },
    sentiment: {
      positive: 62,
      negative: 18,
      neutral: 20,
      overall: "Mostly Positive",
      change: "+5%"
    }
  });

  news$ = this.newsSubject.asObservable();
  metrics$ = this.metricsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ========== NEW METHODS FOR UPDATED COMPONENT ==========

  // Get Times of India news by category
  getTOINews(category: string = 'top-stories', limit: number = 10): Observable<any> {
    console.log(`📡 Fetching TOI news for category: ${category}`);
    
    return this.http.get(`${this.apiUrl}/news/toi?category=${category}&limit=${limit}`)
      .pipe(
        tap(response => console.log('📰 TOI API Response:', response)),
        catchError(error => {
          console.error('❌ Error fetching TOI news:', error);
          return of({
            success: false,
            data: this.getMockTOINews(category),
            count: 5
          });
        })
      );
  }

  // Get dashboard stats for the new template
  getDashboardStats(): Observable<any> {
    console.log('📊 Fetching dashboard stats...');
    
    // TEMPORARY: Return mock data to get frontend working
    return of(this.getMockDashboardStats());
    
    /* Comment out for now - uncomment when backend endpoint exists:
    return this.http.get<any>(`${this.apiUrl}/metrics/stats`)
      .pipe(
        catchError(error => {
          console.error('Error fetching stats:', error);
          return of(this.getMockDashboardStats());
        })
      );
    */
  }

  // Get trending topics
  getTrendingTopics(): Observable<any> {
    console.log('🔥 Fetching trending topics...');
    
    // TEMPORARY: Return mock data to get frontend working
    return of(this.getMockTrendingTopics());
    
    /* Comment out for now - uncomment when backend endpoint exists:
    return this.http.get<any>(`${this.apiUrl}/metrics/trending`)
      .pipe(
        catchError(error => {
          console.error('Error fetching trending:', error);
          return of(this.getMockTrendingTopics());
        })
      );
    */
  }

  // ========== EXISTING METHODS FOR BACKWARD COMPATIBILITY ==========

  // Fetch metrics from backend (original method)
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/metrics`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return this.transformMetrics(response.data);
          }
          throw new Error('Invalid metrics response');
        }),
        tap(metrics => {
          console.log('📊 Metrics updated:', metrics);
          this.metricsSubject.next(metrics);
        }),
        catchError(error => {
          console.error('Error fetching metrics:', error);
          return of(this.metricsSubject.value);
        })
      );
  }

  // Transform API metrics to DashboardMetrics structure
  private transformMetrics(apiMetrics: any): DashboardMetrics {
    return {
      storiesToday: apiMetrics.totalNews || apiMetrics.storiesToday || 0,
      positiveSentiment: this.calculatePositiveSentiment(apiMetrics),
      breakingNow: apiMetrics.alerts || apiMetrics.breakingNow || 0,
      countries: 92,
      activeStories: apiMetrics.activeSources || apiMetrics.activeStories || 0,
      lastUpdated: new Date(),
      breakingCount: apiMetrics.alerts || apiMetrics.breakingCount || 0
    };
  }

  private calculatePositiveSentiment(metrics: any): number {
    if (metrics.avgSentiment !== undefined) {
      return Math.round(((metrics.avgSentiment + 1) / 2) * 100);
    }
    if (metrics.positiveNews !== undefined && metrics.totalNews !== undefined && metrics.totalNews > 0) {
      return Math.round((metrics.positiveNews / metrics.totalNews) * 100);
    }
    return 68;
  }

  // Fetch news from backend (original method)
  getNews(category?: string, timeRange: string = 'live'): Observable<NewsArticle[]> {
    const params: any = {};
    if (category && category !== 'All News') params.category = category;
    if (timeRange) params.timeRange = timeRange;

    return this.http.get<ApiResponse<NewsArticle[]>>(`${this.apiUrl}/news`, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        tap(news => {
          console.log('📰 News updated:', news.length, 'articles');
          this.newsSubject.next(news);
        }),
        catchError(error => {
          console.error('Error fetching news:', error);
          return of([]);
        })
      );
  }

  // Search news
  searchNews(query: string): Observable<NewsArticle[]> {
    console.log(`🔍 Searching for: ${query}`);
    
    return this.http.get<ApiResponse<NewsArticle[]>>(`${this.apiUrl}/news/search?q=${query}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('Search error:', error);
          return of([]);
        })
      );
  }

  // ========== MOCK DATA METHODS ==========

  private getMockTOINews(category: string): NewsArticle[] {
    return [
      {
        id: 'mock-toi-1',
        title: `Latest ${category} News from Times of India`,
        description: 'Real Times of India news loading...',
        publishedAt: new Date().toISOString(),
        source: { name: 'Times of India', id: 'toi' },
        category: category,
        sentiment: 'positive',
        url: 'https://timesofindia.indiatimes.com',
        image: 'https://static.toiimg.com/photo/msid-106999699.cms',
        author: 'TOI News Desk'
      },
      {
        id: 'mock-toi-2',
        title: `Breaking: Major ${category} developments`,
        description: 'Stay tuned for live updates from Times of India',
        publishedAt: new Date().toISOString(),
        source: { name: 'Times of India', id: 'toi' },
        category: category,
        sentiment: 'neutral',
        url: 'https://timesofindia.indiatimes.com',
        image: 'https://static.toiimg.com/photo/msid-106999700.cms',
        author: 'TOI Correspondent'
      }
    ];
  }

  private getMockDashboardStats() {
    return {
      shelves: { count: '1.2k', change: '+12%' },
      positive: { count: '68', change: '+5%' },
      breaking: { count: '14', change: '+9%' },
      counts: { count: '92', change: '+9%' },
      sentiment: {
        positive: 62,
        negative: 18,
        neutral: 20,
        overall: "Mostly Positive",
        change: "+5%"
      }
    };
  }

  private getMockTrendingTopics() {
    return [
      { topic: "AI", count: 128, category: "technology" },
      { topic: "Climate", count: 800, category: "science" },
      { topic: "Elections", count: 754, category: "politics" },
      { topic: "Tech", count: 645, category: "technology" },
      { topic: "Markets", count: 532, category: "business" }
    ];
  }

  // Start auto-refresh (optional)
  startAutoRefresh(intervalMs: number = 60000) {
    this.stopAutoRefresh();
    this.refreshSubscription = interval(intervalMs).subscribe(() => {
      console.log('🔄 Auto-refreshing news...');
      this.getNews().subscribe();
    });
  }

  // Stop auto-refresh
  stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }
}