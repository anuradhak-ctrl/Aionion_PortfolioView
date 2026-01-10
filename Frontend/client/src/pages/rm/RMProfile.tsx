import { DashboardLayout } from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-card rounded-2xl p-8 border border-border/50 shadow-sm flex flex-col ${className}`}>
        {children}
    </div>
);

const LabelValue = ({ label, value, valueColors = "text-foreground" }: { label: string; value: React.ReactNode; valueColors?: string }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-muted-foreground font-medium text-sm">{label}</span>
        <span className={`font-semibold text-sm ${valueColors}`}>{value}</span>
    </div>
);

export default function RMProfile() {
    return (
        <DashboardLayout role="rm">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                <h1 className="text-4xl font-display font-bold text-foreground mb-8">My Profile</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Card 1: Personal Profile */}
                    <Card className="items-center text-center">
                        <div className="mb-6">
                            <Avatar className="h-24 w-24 border-4 border-muted">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-teal-500 text-white text-2xl font-bold">RP</AvatarFallback>
                            </Avatar>
                        </div>

                        <h2 className="text-xl font-bold text-foreground mb-1">Rajesh Patel</h2>
                        <p className="text-muted-foreground text-sm font-medium mb-8">CLT-2024-00145</p>

                        <div className="w-full space-y-4 text-left">
                            <LabelValue label="Email" value="r.patel@email.com" />
                            <LabelValue label="Phone" value="+91 98XXX XXXXX" />
                            <LabelValue label="PAN" value="XXXXX1234X" />
                            <LabelValue label="KYC" value="Verified" valueColors="text-emerald-500" />
                        </div>
                    </Card>

                    {/* Card 2: Investment Profile */}
                    <Card>
                        <h2 className="text-lg font-bold text-foreground mb-8">Investment Profile</h2>

                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-muted-foreground font-medium text-sm">Risk Appetite</span>
                                <span className="text-orange-500 font-bold text-sm">Moderate</span>
                            </div>
                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-[60%] bg-orange-500 rounded-full" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <LabelValue label="Horizon" value="5–10 Years" />
                            <LabelValue label="Tax Slab" value="30%" />
                        </div>
                    </Card>

                    {/* Card 3: Relationship Manager */}
                    <Card className="items-center text-center justify-center">
                        <div className="w-full text-left mb-6">
                            <h2 className="text-lg font-bold text-foreground">Relationship Manager</h2>
                        </div>

                        <div className="flex flex-col items-center mb-8">
                            <Avatar className="h-20 w-20 mb-4 border-2 border-muted">
                                <AvatarFallback className="bg-orange-500 text-white text-xl font-bold">AS</AvatarFallback>
                            </Avatar>
                            <h3 className="text-lg font-bold text-foreground">Anita Sharma</h3>
                            <p className="text-muted-foreground text-sm">Senior Advisor</p>
                        </div>

                        <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors">
                            Schedule Meeting
                        </button>
                    </Card>

                </div>
            </div>
        </DashboardLayout>
    );
}
