// Admin Service - User Management API calls
import apiClient from '../lib/apiClient';

export interface AdminUser {
    id: number;
    client_id: string;  // Cognito username/sub - PRIMARY link to Cognito
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    phone?: string;
    branch_code?: string;
    zone_code?: string;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
}

export interface UserStats {
    total: number;
    byRole: {
        client?: number;
        rm?: number;
        branch_manager?: number;
        zonal_head?: number;
        super_admin?: number;
        director?: number;
    };
}

export interface UsersResponse {
    success: boolean;
    data: {
        users: AdminUser[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
        roleCounts: Record<string, number>;
    };
}

export interface UserStatsResponse {
    success: boolean;
    data: UserStats;
}

export type UserRole = 'all' | 'client' | 'rm' | 'branch_manager' | 'zonal_head' | 'super_admin' | 'director';

class AdminService {
    /**
     * Get users filtered by role with pagination
     */
    async getUsersByRole(
        role: UserRole = 'all',
        page: number = 1,
        limit: number = 50,
        search: string = ''
    ): Promise<UsersResponse> {
        const params = new URLSearchParams({
            role,
            page: String(page),
            limit: String(limit),
        });

        if (search) {
            params.append('search', search);
        }

        const response = await apiClient.get(`/api/admin/users?${params.toString()}`);
        return response.data;
    }

    /**
     * Get user statistics (counts by role)
     */
    async getUserStats(): Promise<UserStatsResponse> {
        const response = await apiClient.get('/api/admin/users/stats');
        return response.data;
    }

    /**
     * Get a single user by ID
     */
    async getUserById(id: number): Promise<{ success: boolean; data: AdminUser }> {
        const response = await apiClient.get(`/api/admin/users/${id}`);
        return response.data;
    }

    /**
     * Create a new user
     */
    async createUser(userData: {
        email: string;
        password: string;
        name: string;
        role: Exclude<UserRole, 'all'>;
    }): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post('/api/admin/users', userData);
        return response.data;
    }

    /**
     * Update user status (active/inactive)
     */
    async updateUserStatus(
        id: number,
        isActive: boolean
    ): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.patch(`/api/admin/users/${id}/status`, { isActive });
        return response.data;
    }

    /**
     * Delete a user
     */
    async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete(`/api/admin/users/${id}`);
        return response.data;
    }

    /**
     * Update user details (email, name, role, status)
     */
    async updateUser(
        id: number,
        userData: {
            email?: string;
            name?: string;
            role?: Exclude<UserRole, 'all'>;
            is_active?: boolean;
        }
    ): Promise<{ success: boolean; message: string; data: AdminUser }> {
        const response = await apiClient.put(`/api/admin/users/${id}`, userData);
        return response.data;
    }
}

export default new AdminService();
