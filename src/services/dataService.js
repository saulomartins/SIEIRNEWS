import axios from 'axios';
import authService from './authService';

const API_URL = '/api/data';

class DataService {
  async getStockData(symbols) {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}?symbols=${symbols.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar dados' };
    }
  }

  async getTickerData(symbol) {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/ticker/${symbol}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar ticker' };
    }
  }

  async getNews() {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/news`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar notícias' };
    }
  }

  async getFinancialJuiceNews() {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/fj-news`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar notícias FJ' };
    }
  }
}

export default new DataService();
