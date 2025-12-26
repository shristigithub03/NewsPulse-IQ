// newsiq-backend/lib/services/toi.service.ts
import Parser from 'rss-parser';

export interface TOIArticle {
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
  sourceType: 'toi';
}

export class TOINewsService {
  private parser: Parser;
  private categories = {
    'top-stories': 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms',
    'business': 'https://timesofindia.indiatimes.com/rssfeeds/1221656.cms',
    'technology': 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',
    'sports': 'https://timesofindia.indiatimes.com/rssfeeds/5880659.cms',
    'entertainment': 'https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms',
    'world': 'https://timesofindia.indiatimes.com/rssfeeds/3907413.cms',
    'politics': 'https://timesofindia.indiatimes.com/rssfeeds/1052732854.cms',
    'science': 'https://timesofindia.indiatimes.com/rssfeeds/-2128672761.cms',
    'health': 'https://timesofindia.indiatimes.com/rssfeeds/3908999.cms',
    'education': 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms',
    'cities': {
      'mumbai': 'https://timesofindia.indiatimes.com/rssfeeds/2177298.cms',
      'delhi': 'https://timesofindia.indiatimes.com/rssfeeds/2177298.cms',
      'bangalore': 'https://timesofindia.indiatimes.com/rssfeeds/2177298.cms',
      'chennai': 'https://timesofindia.indiatimes.com/rssfeeds/2177298.cms',
      'kolkata': 'https://timesofindia.indiatimes.com/rssfeeds/2177298.cms'
    }
  };

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['content:encoded', 'content'],
          ['media:content', 'media'],
          ['dc:creator', 'author']
        ]
      }
    });
  }

  async getNews(category: string = 'top-stories', limit: number = 20): Promise<TOIArticle[]> {
    try {
      let feedUrl: string;
      
      // Handle city categories
      if (category in this.categories.cities) {
        feedUrl = (this.categories.cities as any)[category];
      } else {
        feedUrl = (this.categories as any)[category] || this.categories['top-stories'];
      }

      console.log(`Fetching TOI RSS from: ${feedUrl}`);
      
      const feed = await this.parser.parseURL(feedUrl);
      
      return feed.items.slice(0, limit).map((item: any, index: number) => {
        return this.transformRSSItem(item, category, index);
      });
      
    } catch (error) {
      console.error('Error fetching TOI RSS:', error);
      throw new Error(`Failed to fetch Times of India news: ${(error as Error).message || String(error)}`);
    }
  }

  async searchNews(query: string, limit: number = 20): Promise<TOIArticle[]> {
    try {
      // TOI doesn't have search RSS, so we fetch from multiple categories and filter
      const categories = ['top-stories', 'business', 'technology', 'sports', 'entertainment'];
      const promises = categories.map(cat => this.getNews(cat, 10));
      
      const results = await Promise.allSettled(promises);
      let allArticles: TOIArticle[] = [];
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allArticles = [...allArticles, ...result.value];
        }
      });
      
      // Filter by search query
      const searchTerm = query.toLowerCase();
      const filteredArticles = allArticles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.description.toLowerCase().includes(searchTerm)
      );
      
      // Remove duplicates and limit results
      const uniqueArticles = this.removeDuplicates(filteredArticles);
      return uniqueArticles.slice(0, limit);
      
    } catch (error) {
      console.error('Error searching TOI news:', error);
      return [];
    }
  }

  private transformRSSItem(item: any, category: string, index: number): TOIArticle {
    // Extract image from content
    const image = this.extractImage(item.content || item.description || '');
    
    // Analyze sentiment
    const sentiment = this.analyzeSentiment(item.title + ' ' + (item.description || ''));
    
    // Map RSS category to your app category
    const appCategory = this.mapToAppCategory(category);
    
    return {
      id: `toi-${Date.now()}-${index}`,
      title: item.title?.trim() || 'No Title',
      description: this.cleanDescription(item.description || item.contentSnippet || ''),
      publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      source: { 
        name: 'Times of India', 
        id: 'the-times-of-india' 
      },
      category: appCategory,
      sentiment,
      url: item.link || '',
      image,
      author: item.author || item.creator || 'Times of India',
      content: this.cleanContent(item.content || ''),
      sourceType: 'toi'
    };
  }

  private extractImage(content: string): string {
    if (!content) return '';
    
    // Try to find image in content
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    const matches = imgRegex.exec(content);
    
    if (matches && matches[1]) {
      return matches[1];
    }
    
    // Try to find Times of India specific image patterns
    const toiImgRegex = /https:\/\/static\.toiimg\.com\/[^"\s]+/gi;
    const toiMatches = toiImgRegex.exec(content);
    
    return toiMatches ? toiMatches[0] : '';
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    if (!text) return 'neutral';
    
    const lowerText = text.toLowerCase();
    
    // Positive indicators
    const positivePatterns = [
      /\b(good|great|excellent|positive|success|win|won|growth|profit|achievement|record|breakthrough)\b/i,
      /\b(improve|better|boost|rise|gain|surge|increase|up|high|peak|best)\b/i,
      /\b(happy|joy|celebrate|celebration|congratulation|award|honor|praise)\b/i,
      /\b(breakthrough|innovation|advance|progress|solution|resolve|recover)\b/i
    ];
    
    // Negative indicators
    const negativePatterns = [
      /\b(bad|poor|negative|failure|loss|lost|decline|fall|down|low|worse|worst)\b/i,
      /\b(crisis|problem|issue|error|mistake|fault|flaw|defect|bug|crash|fail)\b/i,
      /\b(sad|angry|protest|strike|violence|attack|kill|death|murder|accident)\b/i,
      /\b(scam|fraud|corruption|bribe|cheat|steal|theft|robbery|arrest|jail)\b/i,
      /\b(disease|virus|pandemic|epidemic|infection|sick|illness|hospital)\b/i
    ];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positivePatterns.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) positiveScore += matches.length;
    });
    
    negativePatterns.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) negativeScore += matches.length;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private mapToAppCategory(rssCategory: string): string {
    const categoryMap: Record<string, string> = {
      'top-stories': 'General',
      'business': 'Business',
      'technology': 'Technology',
      'sports': 'Sports',
      'entertainment': 'Entertainment',
      'world': 'World',
      'politics': 'Politics',
      'science': 'Science',
      'health': 'Health',
      'education': 'Education',
      'mumbai': 'Mumbai',
      'delhi': 'Delhi',
      'bangalore': 'Bangalore',
      'chennai': 'Chennai',
      'kolkata': 'Kolkata'
    };
    
    return categoryMap[rssCategory] || 'General';
  }

  private cleanDescription(description: string): string {
    if (!description) return '';
    
    // Remove HTML tags
    let clean = description.replace(/<[^>]*>/g, '');
    
    // Remove TOI specific text
    clean = clean.replace(/Read more at Times of India|TOI\.com|\(PTI\)|\(ANI\)/gi, '');
    
    // Trim and limit length
    clean = clean.trim();
    if (clean.length > 200) {
      clean = clean.substring(0, 197) + '...';
    }
    
    return clean;
  }

  private cleanContent(content: string): string {
    if (!content) return '';
    
    // Remove script and style tags
    let clean = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove iframes
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    
    // Remove ads and TOI specific elements
    clean = clean.replace(/<div class="(ad|ads|advertisement)[^>]*>.*?<\/div>/gi, '');
    clean = clean.replace(/class="[^"]*"/gi, '');
    clean = clean.replace(/style="[^"]*"/gi, '');
    
    return clean.trim();
  }

  private removeDuplicates(articles: TOIArticle[]): TOIArticle[] {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}