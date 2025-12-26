// newsiq-backend/app/api/news/toi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TOINewsService } from '@/lib/services/toi.services';

const toiService = new TOINewsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'top-stories';
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    let articles;
    
    if (search) {
      articles = await toiService.searchNews(search, limit);
    } else {
      articles = await toiService.getNews(category, limit);
    }

    return NextResponse.json({
      success: true,
      source: 'Times of India',
      category: category,
      count: articles.length,
      data: articles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TOI API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Times of India news',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// For fetching multiple categories at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories = ['top-stories'], limit = 10 } = body;
    
    const promises = categories.map((category: string) => 
      toiService.getNews(category, limit)
    );
    
    const results = await Promise.allSettled(promises);
    
    const allArticles = results
      .filter((result): result is PromiseFulfilledResult<any[]> => 
        result.status === 'fulfilled'
      )
      .flatMap(result => result.value);
    
    // Remove duplicates
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.title, article])).values()
    ).slice(0, limit * categories.length);

    return NextResponse.json({
      success: true,
      sources: ['Times of India'],
      categories: categories,
      count: uniqueArticles.length,
      data: uniqueArticles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TOI Batch API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch batch news',
      data: [],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}