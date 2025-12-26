import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { NewsService } from './services/news.services';


// Interface matching TOI API response
interface NewsArticle {
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
  content?: string;
  sourceType: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // Dashboard Properties
  title = 'NewsPulse IQ - Live Dashboard';
  newsArticles: NewsArticle[] = [];
  currentCategory: string = 'top-stories';
  dashboardStats: any = {};
  trendingTopics: any[] = [];
  isLoading: boolean = false;
  darkMode: boolean = true;

  // Quiz Properties
  selectedQuizOption: string | null = null;
  quizResult: any = null;
  currentQuizIndex = 0;
  quizQuestions = [
    {
      question: "What percentage of today's news has positive sentiment?",
      options: ['62%', '65%', '75%', '55%'],
      correctAnswer: '62%',
      difficulty: 'Easy'
    },
    {
      question: "Which topic has the highest count in trending?",
      options: ['AI', 'Climate', 'Tech', 'Markets'],
      correctAnswer: 'Climate',
      difficulty: 'Medium'
    },
    {
      question: "How many breaking news stories are there?",
      options: ['10', '14', '18', '22'],
      correctAnswer: '14',
      difficulty: 'Easy'
    }
  ];

  // Categories for filtering
  categories = [
    { id: 'top-stories', name: 'Top Stories', icon: '📰' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'world', name: 'World', icon: '🌎' },
    { id: 'politics', name: 'Politics', icon: '🏛️' },
    { id: 'health', name: 'Health', icon: '🏥' }
  ];

  // Trending topics data
  trendingData = [
    { topic: 'AI', count: '128', category: 'technology' },
    { topic: 'Climate', count: '800', category: 'science' },
    { topic: 'Elections', count: '754', category: 'politics' },
    { topic: 'Tech', count: '645', category: 'technology' },
    { topic: 'Markets', count: '532', category: 'business' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(private newsService: NewsService) {}

  // ========== INITIALIZATION ==========
  ngOnInit() {
    console.log('📊 Initializing NewsPulse IQ Dashboard...');
    
    // Set dark mode by default
    document.body.classList.add('dark-mode');
    
    this.loadDashboardData();
    this.loadNews('top-stories');
  }

  // ========== THEME MANAGEMENT ==========
  toggleTheme() {
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
    console.log(`🌓 Theme changed to: ${this.darkMode ? 'Dark' : 'Light'} Mode`);
  }

  // ========== NEWS FUNCTIONS ==========
  loadNews(category: string) {
    this.isLoading = true;
    this.currentCategory = category;
    
    console.log(`📡 Loading ${category} news from Times of India...`);
    
    this.newsService.getTOINews(category).subscribe({
      next: (response) => {
        console.log('📰 API Response:', response);
        if (response.success && response.data) {
          this.newsArticles = response.data;
          console.log(`✅ Loaded ${this.newsArticles.length} real articles from TOI`);
        } else {
          this.newsArticles = response.data || [];
          console.log('Using API data');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading news:', error);
        this.newsArticles = this.getMockNews(category);
        this.isLoading = false;
      }
    });
  }

  refreshNews() {
    console.log('🔄 Refreshing news');
    this.loadNews(this.currentCategory);
  }

  // ========== DASHBOARD DATA ==========
  loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    // Load stats from your backend
    this.newsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        console.log('✅ Dashboard stats loaded:', stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.dashboardStats = this.getMockDashboardStats();
      }
    });

    // Load trending topics
    this.newsService.getTrendingTopics().subscribe({
      next: (topics) => {
        this.trendingTopics = topics;
        console.log('✅ Trending topics loaded');
      },
      error: (error) => {
        console.error('Error loading trending:', error);
        this.trendingTopics = this.trendingData;
      }
    });
  }

  // ========== QUIZ FUNCTIONS ==========
  selectQuizOption(option: string) {
    this.selectedQuizOption = option;
    this.quizResult = null;
    console.log('✅ Quiz option selected:', option);
  }

  submitQuiz() {
    if (!this.selectedQuizOption) {
      alert('Please select an answer first!');
      return;
    }
    
    const currentQuestion = this.quizQuestions[this.currentQuizIndex];
    const isCorrect = this.selectedQuizOption === currentQuestion.correctAnswer;
    
    this.quizResult = {
      isCorrect,
      message: isCorrect 
        ? `🎉 Correct! The answer is ${currentQuestion.correctAnswer}` 
        : `❌ Incorrect. The correct answer is ${currentQuestion.correctAnswer}`
    };
    
    console.log('📝 Quiz submitted:', isCorrect ? 'Correct!' : 'Incorrect');
  }

  nextQuizQuestion() {
    this.currentQuizIndex = (this.currentQuizIndex + 1) % this.quizQuestions.length;
    this.selectedQuizOption = null;
    this.quizResult = null;
    console.log('➡️ Moving to next question');
  }

  // Legacy method for compatibility
  selectOption(option: string) {
    this.selectQuizOption(option);
  }

  // ========== ARTICLE FUNCTIONS ==========
  getSentimentClass(sentiment: string): string {
    switch(sentiment) {
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      case 'neutral': return 'sentiment-neutral';
      default: return '';
    }
  }

  getSentimentIcon(sentiment: string): string {
    switch(sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      case 'neutral': return '😐';
      default: return '📰';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Just now';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  shareArticle(article: NewsArticle) {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url
      });
    } else {
      const shareText = `${article.title}\n\n${article.description}\n\nRead more: ${article.url}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
        alert('📋 Article link copied to clipboard!');
      } else {
        prompt('Copy this link to share:', article.url);
      }
    }
  }

  openArticle(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  // ========== SEARCH FUNCTION ==========
  onSearch(searchQuery: string) {
    console.log('🔍 Searching for:', searchQuery);
    // Implement search if needed
  }

  // ========== MOCK DATA (FALLBACK) ==========
  private getMockNews(category: string): NewsArticle[] {
    return [
      {
        id: 'mock-1',
        title: `Latest ${category} News from Times of India`,
        description: 'Connecting to real Times of India RSS feed...',
        publishedAt: new Date().toISOString(),
        source: { name: 'Times of India', id: 'toi' },
        category: category,
        sentiment: 'positive',
        url: '#',
        image: 'https://static.toiimg.com/photo/msid-106999699.cms',
        sourceType: 'toi'
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

  // ========== CLEANUP ==========
  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
  }
}