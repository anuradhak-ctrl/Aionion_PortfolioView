import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-card rounded-2xl p-6 border border-border/50 shadow-sm ${className}`}>
        {children}
    </div>
);

const CircularProgress = ({ value, label, subtext }: { value: number; label: string; subtext: string }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className="stroke-muted"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#10b981" // Emerald-500
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute text-3xl font-bold text-foreground">{value}</span>
            </div>
            <div className="text-center">
                <h3 className="text-foreground font-medium text-lg mb-1">{label}</h3>
                <p className="text-emerald-500 text-sm font-medium">{subtext}</p>
            </div>
        </div>
    );
};

const LinearProgress = ({
    title,
    value, // percentage or level
    max = 100,
    labelRight,
    colorClass = "bg-emerald-500"
}: {
    title: string;
    value: number;
    max?: number;
    labelRight: string;
    colorClass?: string;
}) => {
    return (
        <div className="flex flex-col justify-center h-full">
            <h3 className="text-foreground font-semibold text-lg mb-6">{title}</h3>
            <div className="flex justify-between text-sm mb-2 text-muted-foreground font-medium">
                <span>Score</span>
                <span className={colorClass.replace('bg-', 'text-')}>{labelRight}</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colorClass}`}
                    style={{ width: `${(value / max) * 100}%` }}
                />
            </div>
        </div>
    );
};

const RiskMetric = ({ label, value, subtext }: { label: string; value: string; subtext?: string }) => (
    <div className="bg-muted/30 border border-border/50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <span className="text-muted-foreground text-sm font-medium mb-2">{label}</span>
        <span className="text-foreground text-2xl font-bold">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground mt-1">{subtext}</span>}
    </div>
);

const OpportunityItem = ({ title, desc, accentColor }: { title: string; desc: string; accentColor: string }) => (
    <div className="relative bg-muted/30 border border-border/50 rounded-xl p-5 pl-7 overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`} />
        <h4 className="text-foreground font-bold text-base mb-1">{title}</h4>
        <p className="text-muted-foreground text-sm">{desc}</p>
    </div>
);

export default function BMInsights() {
    return (
        <DashboardLayout role="bm">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-display font-bold text-foreground">Insights & Analytics</h1>
                    <div className="flex gap-4">
                        {/* Actions could go here */}
                    </div>
                </div>

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Portfolio Health */}
                    <Card className="aspect-square lg:aspect-auto lg:h-64">
                        <CircularProgress value={75} label="Portfolio Health" subtext="Good" />
                    </Card>

                    {/* Diversification */}
                    <Card className="lg:h-64">
                        <LinearProgress
                            title="Diversification"
                            value={82}
                            labelRight="82/100"
                            colorClass="bg-emerald-500"
                        />
                    </Card>

                    {/* Risk Level */}
                    <Card className="lg:h-64">
                        <LinearProgress
                            title="Risk Level"
                            value={60}
                            labelRight="Moderate"
                            colorClass="bg-orange-500"
                        />
                    </Card>

                    {/* Liquidity */}
                    <Card className="lg:h-64">
                        <LinearProgress
                            title="Liquidity"
                            value={68}
                            labelRight="68/100"
                            colorClass="bg-teal-400"
                        />
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Missed Opportunities */}
                    <Card className="p-8">
                        <h2 className="text-xl font-bold text-foreground mb-6">Missed Opportunities</h2>
                        <div className="space-y-4">
                            <OpportunityItem
                                title="High Cash"
                                desc="Rs.2.5L uninvested"
                                accentColor="bg-orange-500"
                            />
                            <OpportunityItem
                                title="Over-concentration"
                                desc="RELIANCE at 12%"
                                accentColor="bg-orange-500"
                            />
                            <OpportunityItem
                                title="Sector Gap"
                                desc="No Pharma exposure"
                                accentColor="bg-orange-500"
                            />
                        </div>
                    </Card>

                    {/* Risk Metrics */}
                    <Card className="p-8">
                        <h2 className="text-xl font-bold text-foreground mb-6">Risk Metrics</h2>
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <RiskMetric label="Beta" value="1.12" />
                            <RiskMetric label="Volatility" value="14.2%" />
                            <RiskMetric label="Sharpe" value="1.45" />
                            <RiskMetric label="Max DD" value="-8.5%" />
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
