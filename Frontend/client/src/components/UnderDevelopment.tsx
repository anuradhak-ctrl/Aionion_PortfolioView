import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";

interface UnderDevelopmentProps {
    role: string;
    pageName: string;
}

export default function UnderDevelopment({ role, pageName }: UnderDevelopmentProps) {
    return (
        <DashboardLayout role={role}>
            <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                            {pageName}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            This page is under development.
                        </p>
                    </motion.div>
                </div>

                {/* Under Development Message */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center min-h-[400px] bg-card border border-border/50 rounded-2xl p-12"
                >
                    <Construction className="w-24 h-24 text-muted-foreground/40 mb-6" />
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                        {pageName} is Under Development
                    </h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        We're working hard to bring you this feature. Please check back soon!
                    </p>
                </motion.div>

                {/* Footer */}
                <footer className="pt-8 pb-4 text-center text-sm text-muted-foreground border-t border-border/30 mt-8">
                    <p>© 2025 Portfolio View. All rights reserved.</p>
                </footer>
            </div>
        </DashboardLayout>
    );
}
