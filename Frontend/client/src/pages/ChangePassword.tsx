import { useState } from "react";
import { useLocation } from "wouter";
import authService from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function ChangePassword() {
    const [, setLocation] = useLocation();
    const { login } = useAuth(); // Need to fully login after change
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Change Password
            const response = await authService.changePassword(newPassword);

            if (response.status === 'SUCCESS' || response.tokens) {
                setSuccess("Password changed successfully! Logging you in...");

                // 2. Clear status
                sessionStorage.removeItem('authStatus');

                // 3. User is effectively logged in now if tokens returned
                // Wait a moment and redirect
                setTimeout(() => {
                    // Force reload or re-login context sync? 
                    // AuthContext handles login if tokens are in LocalStorage.
                    // AuthService.changePassword ALREADY calls handleSuccessfulAuth if valid.
                    // So we just redirect.
                    window.location.href = "/"; // Force full reload to ensure context picks up new user state
                }, 1500);

            } else if (response.status === 'MFA_SETUP') {
                // Redirect to MFA Setup
                sessionStorage.setItem('authStatus', 'MFA_SETUP');
                // We don't have MFA setup page yet! But let's assume standard flow requires login again or similar.
                // Actually, if MFA_SETUP is next, we should redirect there or show it.
                setError("MFA Setup Required - Please contact admin (feature in progress)");
            }

        } catch (err: any) {
            setError(err.message || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Change Password</h1>
                        <p className="text-muted-foreground">Please set a new secure password for your account.</p>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg p-3 mb-6 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary pr-10"
                                        placeholder="Min 8 characters"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary pr-10"
                                        placeholder="Re-enter password"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!success}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Set New Password"
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
