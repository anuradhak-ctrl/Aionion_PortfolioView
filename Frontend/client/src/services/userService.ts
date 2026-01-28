import apiClient from '../lib/apiClient';
import { mockSubordinates } from '@/utils/mockData';

const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

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
  client_id?: string;
  name: string;
  email: string;
  phone?: string;
  portfolioValue?: number;
  assignedRM?: string;
  status?: string;
}

export interface Subordinate {
  id: number;
  client_id?: string;
  email: string;
  name: string;
  role: string;
  status: string;
  parent_id?: number;
  created_at?: string;
  level?: number;
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
    if (USE_LOCAL_AUTH) {
      console.log('🔓 UserService: Using mock clients data');
      return mockSubordinates.rm.clients.map(client => ({
        id: client.id.toString(),
        client_id: client.clientId,
        name: client.name,
        email: client.email,
        status: client.status,
        portfolioValue: client.portfolioValue,
        assignedRM: 'Vikram Singh' // Mock assignment
      }));
    }
    const response = await apiClient.get('/api/users/clients');
    return response.data.clients;
  }

  async getSubordinates(userId?: number, nested: boolean = true): Promise<Subordinate[]> {
    const endpoint = userId
      ? `/api/users/${userId}/subordinates?nested=${nested}`
      : `/api/users/me/subordinates?nested=${nested}`;
    const response = await apiClient.get(endpoint);
    return response.data.data || [];
  }
}

export default new UserService();
