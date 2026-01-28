import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { LogIn, Settings } from 'lucide-react';

const OperationsLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [, setLocation] = useLocation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // For testing: Allow any username and password
            // In production, validate against backend or environment variables
            if (username.trim() && password.trim()) {
                // Create a simple user object
                const user = {
                    username: username,
                    name: username.charAt(0).toUpperCase() + username.slice(1),
                    role: 'operations',
                    loginTime: new Date().toISOString()
                };

                // Store in localStorage
                localStorage.setItem('operations_token', 'operations-' + Date.now());
                localStorage.setItem('operations_user', JSON.stringify(user));

                // Redirect to dashboard
                setLocation('/operations-dashboard');
            } else {
                setError('Please enter both username and password');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4">
                        <Settings className="w-10 h-10 text-purple-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Operations Portal</h1>
                    <p className="text-purple-100">Manage MF and Bond Reports</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                'Logging in...'
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Login to Operations
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-900 mb-2">🧪 Testing Mode</p>
                            <p className="text-sm text-blue-800">
                                You can login with <strong>any username and password</strong> for testing purposes.
                            </p>
                            <p className="text-xs text-blue-700 mt-2">
                                Example: username: <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">test</span> / password: <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">test</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-purple-100 text-sm">
                    <p>© 2026 Portfolio Management System</p>
                </div>
            </div>
        </div>
    );
};

export default OperationsLogin;
