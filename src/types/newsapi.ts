export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  image_url: string | null;
  published_at: string;
  created_at: string;
  relevance_score: number | null;
  category: string;
  tags: string[] | null;
  language?: string; // Added language field
}

export interface UserPreference {
  id: string;
  user_id: string;
  keywords: string[] | null;
  categories: string[] | null;
  sources: string[] | null;
  excluded_keywords: string[] | null;
  languages: string[] | null; // Added languages field
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  last_login: string | null;
}

export interface SystemSettings {
  id: string;
  last_run?: string | null;
  status?: string;
  articles_count?: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  next_scheduled?: string | null;
  frequency?: string;
  enabled?: boolean;
}

export interface AggregationLog {
  id: string;
  event_type: string;
  status: string;
  details: Record<string, any> | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  note: string | null;
  article?: Article; // Optional joined article data
}

export interface ArticleView {
  id: string;
  user_id: string;
  article_id: string;
  viewed_at: string;
  view_duration: number | null;
  article?: Article; // Optional joined article data
}