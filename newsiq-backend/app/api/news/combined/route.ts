// newsiq-backend/app/api/news/combined/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TOINewsService } from '@/lib/services/toi.services';

const toiService = new TOINewsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'All News';
    const limit = parseInt(searchParams.get('limit') || '30');
    const sources = searchParams.get('sources')?.split(',') || ['toi', 'custom'];
    
    const results: any[] = [];
    
    // Fetch from TOI if requested
    if (sources.includes('toi')) {
      try {
        const toiCategory = mapToTOICategory(category);
        const toiNews = await toiService.getNews(toiCategory, Math.ceil(limit / 2));
        results.push(...toiNews.map(article => ({
          ...article,
          priority: 1 // Higher priority for TOI
        })));
      } catch (error) {
        console.warn('Failed to fetch TOI news:', error);
      }
    }
    
    // Fetch from your custom API if requested
    if (sources.includes('custom')) {
      try {
        // Your existing news endpoint
        const customResponse = await fetch(
          `http://localhost:3000/api/news?category=${category}&limit=${Math.ceil(limit / 2)}`,
          { headers: request.headers }
        );
        
        if (customResponse.ok) {
          const customData = await customResponse.json();
          if (customData.success && customData.data) {
            results.push(...customData.data.map((article: any) => ({
              ...article,
              sourceType: 'custom',
              priority: 2 // Lower priority for custom news
            })));
          }
        }
      } catch (error) {
        console.warn('Failed to fetch custom news:', error);
      }
    }
    
    // Sort by priority and published date
    const sortedArticles = results
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, limit);
    
    // Remove duplicates
    const uniqueArticles = removeDuplicates(sortedArticles);
    
    return NextResponse.json({
      success: true,
      sources: sources,
      category: category,
      count: uniqueArticles.length,
      data: uniqueArticles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Combined News API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch combined news',
      data: [],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function mapToTOICategory(appCategory: string): string {
  const map: Record<string, string> = {
    'All News': 'top-stories',
    'Technology': 'technology',
    'Sports': 'sports',
    'Business': 'business',
    'Entertainment': 'entertainment',
    'Health': 'health',
    'Science': 'science',
    'Politics': 'politics',
    'World': 'world'
  };
  
  return map[appCategory] || 'top-stories';
}

function removeDuplicates(articles: any[]): any[] {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}