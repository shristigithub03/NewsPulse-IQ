import { NextResponse } from 'next/server';

const mockNews = [
  {
    id: '1',
    title: 'AI Breakthrough in Medical Diagnostics',
    description: 'New AI system can detect diseases with 99% accuracy, revolutionizing early diagnosis.',
    publishedAt: new Date().toISOString(),
    source: { name: 'Tech Innovations' },
    sentiment: 'positive',
    category: 'Technology',
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    id: '2',
    title: 'Global Climate Summit Reaches Historic Agreement',
    description: 'World leaders commit to ambitious carbon reduction targets by 2030.',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: 'Global News Network' },
    sentiment: 'positive',
    category: 'Environment',
    coordinates: { lat: 48.8566, lng: 2.3522 }
  },
  {
    id: '3',
    title: 'Stock Markets Reach All-Time High',
    description: 'Major indices surge as investor confidence grows amid economic recovery.',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: 'Financial Times' },
    sentiment: 'positive',
    category: 'Business',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: '4',
    title: 'New Security Vulnerability Found in Popular Software',
    description: 'Millions of devices potentially affected by critical security flaw.',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: 'Cyber Security News' },
    sentiment: 'negative',
    category: 'Technology',
    coordinates: { lat: 47.6062, lng: -122.3321 }
  },
  {
    id: '5',
    title: 'Major Sports Championship Ends in Upset Victory',
    description: 'Underdog team wins championship in stunning last-minute victory.',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: 'Sports Network' },
    sentiment: 'positive',
    category: 'Sports',
    coordinates: { lat: 51.5074, lng: -0.1278 }
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const timeRange = searchParams.get('timeRange') || 'today';
    
    // Filter logic...
    let filteredNews = mockNews;
    if (category !== 'all' && category !== 'All News') {
      filteredNews = mockNews.filter(article => 
        article.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    return NextResponse.json({
      success: true,
      count: filteredNews.length,
      data: filteredNews
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch news'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Content-Type': 'application/json'
      }
    });
  }
}