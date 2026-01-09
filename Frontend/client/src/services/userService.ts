import apiClient from '../lib/apiClient';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  portfolioValue?: number;
  assignedRM?: string;
  status?: string;
}

class UserService {
  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/api/users/profile');
    return response.data;
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put('/api/users/profile', data);
    return response.data;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const response = await apiClient.get('/api/users');
    return response.data;
  }

  async getClients(): Promise<Client[]> {
    const response = await apiClient.get('/api/users/clients');
    return response.data;
  }
}

export default new UserService();
