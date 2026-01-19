import { useState } from 'react';

// Icons
const DownloadIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const PdfIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const ExcelIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

interface ExportButtonProps {
    onExport: (format: 'pdf' | 'excel') => void;
}

export const ExportButton = ({ onExport }: ExportButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = (format: 'pdf' | 'excel') => {
        onExport(format);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
            >
                <DownloadIcon className="w-3 h-3 md:w-4 md:h-4" />
                <span className="leading-none">Export</span>
                <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4 ml-1" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="w-full text-left px-4 py-2.5 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                        >
                            <PdfIcon className="w-4 h-4" />
                            PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="w-full text-left px-4 py-2.5 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                        >
                            <ExcelIcon className="w-4 h-4" />
                            Excel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportButton;
