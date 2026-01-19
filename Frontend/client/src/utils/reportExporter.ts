/**
 * Report Exporter Utility
 * Generates professional PDF and Excel reports with custom formatting
 */

export type ExportFormat = 'pdf' | 'excel';

interface ReportConfig {
    title: string;
    filter: string;
    clientId: string;
    data: any[];
    columns: { header: string; key: string; align?: 'left' | 'right' | 'center' }[];
    summaryCards?: { label: string; value: string | number; className?: string }[];
}

const generateStyledHTML = (config: ReportConfig): string => {
    const { title, filter, clientId, data, columns, summaryCards } = config;
    const today = new Date().toLocaleDateString('en-GB');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; align-items: center; justify-content: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; gap: 15px; }
        .logo-img { height: 50px; width: auto; object-fit: contain; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1e40af; }
        .client-info { margin-bottom: 30px; }
        .client-info p { margin: 5px 0; color: #666; }
        .client-id { font-weight: bold; color: #000; }
        .report-title { font-size: 18px; font-weight: 600; margin: 20px 0; }
        .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .summary-card { padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9fafb; }
        .summary-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .summary-value { font-size: 16px; font-weight: bold; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: #f3f4f6; }
        th { padding: 12px; text-align: left; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0; white-space: nowrap; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        tr:hover { background: #f9fafb; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .font-bold { font-weight: bold; }
        .buy-badge { background: #d1fae5; color: #059669; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-block; }
        .sell-badge { background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-block; }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${window.location.origin}/logo.png" alt="Aionion Capital" class="logo-img" onerror="this.style.display='none'" />
        <div class="logo-text">Aionion Capital Markets</div>
    </div>
    
    <div class="client-info">
        <p><span class="client-id">Client ID:</span> ${clientId}</p>
    </div>
    
    <h2 class="report-title">${title} - ${filter === "All" ? "All Assets" : filter} (${today})</h2>
    
    ${summaryCards ? `
    <div class="summary-cards">
        ${summaryCards.map(card => `
            <div class="summary-card">
                <div class="summary-label">${card.label}</div>
                <div class="summary-value ${card.className || ''}">${card.value}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <table>
        <thead>
            <tr>
                ${columns.map(col => `<th class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">${col.header}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map(row => `
                <tr>
                    ${columns.map(col => {
        const value = row[col.key];
        let content = value || "-";

        // Special formatting for trade type
        if (col.key === 'tradeType') {
            content = `<span class="${value === 'BUY' ? 'buy-badge' : 'sell-badge'}">${value}</span>`;
        }

        return `<td class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.key === 'symbol' ? 'font-bold' : ''}">${content}</td>`;
    }).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
};

export const exportReport = (config: ReportConfig, format: ExportFormat) => {
    const html = generateStyledHTML(config);

    if (format === 'pdf') {
        // Open in new window and trigger print dialog (save as PDF)
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
            newWindow.onload = () => {
                setTimeout(() => newWindow.print(), 250);
            };
        }
    } else {
        // Download as Excel-compatible HTML
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${config.title.toLowerCase().replace(/ /g, '_')}_${config.filter.toLowerCase()}.xls`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
