import axios from 'axios';
import type { NewsApiResponse } from '../types/newsapi';

// API key from PRD
const API_KEY = 'efc7d919e7af413ba5a7f4a3ebdb3862';
const BASE_URL = 'https://newsapi.org/v2';

// Function to fetch top headlines
export async function fetchTopHeadlines(
  category: string = '',
  country: string = 'us',
  pageSize: number = 20
): Promise<NewsApiResponse> {
  try {
    const params: Record<string, string | number> = {
      apiKey: API_KEY,
      country,
      pageSize
    };

    if (category) {
      params.category = category;
    }

    const response = await axios.get(`${BASE_URL}/top-headlines`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching top headlines:', error);
    throw error;
  }
}

// Function to search articles
export async function searchArticles(
  query: string,
  sortBy: string = 'publishedAt',
  pageSize: number = 20
): Promise<NewsApiResponse> {
  try {
    const response = await axios.get(`${BASE_URL}/everything`, {
      params: {
        q: query,
        sortBy,
        pageSize,
        apiKey: API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching articles:', error);
    throw error;
  }
}