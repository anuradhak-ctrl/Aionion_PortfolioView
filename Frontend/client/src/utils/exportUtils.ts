import * as XLSX from 'xlsx';

interface ExportOptions {
    fileName: string;
    sheetName: string;
    companyName?: string;
    clientName?: string;
    clientId?: string;
    rmName?: string;
    status?: string;
    reportTitle: string;
}

/**
 * Export data to XLSX format with professional styling
 */
export const exportToXLSX = (
    data: any[],
    headers: string[],
    options: ExportOptions
) => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Prepare data array with headers and metadata
    const wsData: any[][] = [];

    // Add company header
    wsData.push([options.companyName || 'Aionion Investment Services']);
    wsData.push(['Client Report']);
    wsData.push([]); // Empty row

    // Add client information
    if (options.clientName) {
        wsData.push([options.clientName]);
        const clientInfo = [];
        if (options.rmName) clientInfo.push(`RM: ${options.rmName}`);
        if (options.clientId) clientInfo.push(`Client ID: ${options.clientId}`);
        if (options.status) clientInfo.push(`Status: ${options.status}`);
        wsData.push([clientInfo.join(' • ')]);
        wsData.push([`Generated on: ${new Date().toLocaleDateString()}`]);
        wsData.push([]); // Empty row
    }

    // Add report title
    wsData.push([options.reportTitle]);
    wsData.push([]); // Empty row

    // Add headers
    wsData.push(headers);

    // Add data rows
    data.forEach(row => {
        wsData.push(row);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = headers.map((header, idx) => {
        const maxLength = Math.max(
            header.length,
            ...data.map(row => String(row[idx] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    ws['!cols'] = colWidths;

    // Apply styling
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Style company name (row 0)
    const companyCell = ws['A1'];
    if (companyCell) {
        companyCell.s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' }
        };
    }

    // Style "Client Report" (row 1)
    const reportTypeCell = ws['A2'];
    if (reportTypeCell) {
        reportTypeCell.s = {
            font: { sz: 12 },
            alignment: { horizontal: 'center' }
        };
    }

    // Find header row (it's after all the metadata)
    let headerRowIndex = 0;
    for (let i = 0; i < wsData.length; i++) {
        if (wsData[i].length === headers.length && wsData[i][0] === headers[0]) {
            headerRowIndex = i;
            break;
        }
    }

    // Style header row
    for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
        const cell = ws[cellAddress];
        if (cell) {
            cell.s = {
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '4472C4' } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    bottom: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } },
                    right: { style: 'thin', color: { rgb: '000000' } }
                }
            };
        }
    }

    // Style data rows with borders
    for (let row = headerRowIndex + 1; row <= range.e.r; row++) {
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = ws[cellAddress];
            if (cell) {
                cell.s = {
                    border: {
                        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
                        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
                        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
                        right: { style: 'thin', color: { rgb: 'D3D3D3' } }
                    },
                    alignment: { vertical: 'center' }
                };
            }
        }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName);

    // Generate and download file
    XLSX.writeFile(wb, `${options.fileName}.xlsx`);
};

/**
 * Export Holdings data to XLSX
 */
export const exportHoldingsToXLSX = (
    holdings: any[],
    clientInfo: {
        clientName: string;
        clientId: string;
        rmName?: string;
        status?: string;
    }
) => {
    const headers = [
        'Symbol',
        'ISIN',
        'Sector',
        'Quantity Available',
        'Quantity Discrepant',
        'Quantity Long Term',
        'Quantity Pledged (Margin)',
        'Quantity Pledged (Loan)',
        'Average Price',
        'Previous Closing Price',
        'Unrealized P&L',
        'Unrealized P&L %',
        'Asset'
    ];

    const data = holdings.map(h => [
        h.symbol || h.security,
        h.isin || '',
        h.sector || '',
        h.qtyAvailable || h.qty || 0,
        h.qtyDiscrepant || 0,
        h.qtyLongTerm || h.qty || 0,
        h.qtyPledgedMargin || 0,
        h.qtyPledgedLoan || 0,
        h.avgPrice || '',
        h.prevClosing || h.cmp || '',
        h.unrealizedPL || h.pl || '',
        h.unrealizedPLPercent || h.return || '',
        h.type || 'Equity'
    ]);

    exportToXLSX(data, headers, {
        fileName: `holdings_${clientInfo.clientId}_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'Holdings',
        clientName: clientInfo.clientName,
        clientId: clientInfo.clientId,
        rmName: clientInfo.rmName,
        status: clientInfo.status,
        reportTitle: 'Holdings Report'
    });
};

/**
 * Export Transactions data to XLSX
 */
export const exportTransactionsToXLSX = (
    transactions: any[],
    clientInfo: {
        clientName: string;
        clientId: string;
        rmName?: string;
        status?: string;
    }
) => {
    const headers = [
        'Symbol',
        'ISIN',
        'Trade Date',
        'Exchange',
        'Segment',
        'Series',
        'Trade Type',
        'Auction',
        'Quantity',
        'Price',
        'Trade ID',
        'Order ID',
        'Order Execution Time',
        'Asset'
    ];

    const data = transactions.map(t => [
        t.symbol || t.asset,
        t.isin || '',
        t.tradeDate || t.date,
        t.exchange || '',
        t.segment || '',
        t.series || '',
        t.tradeType || t.type,
        t.auction || 'No',
        t.quantity || '',
        t.price || t.amount,
        t.tradeId || '',
        t.orderId || '',
        t.executionTime || '',
        t.asset || t.segment || ''
    ]);

    exportToXLSX(data, headers, {
        fileName: `transactions_${clientInfo.clientId}_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'Transactions',
        clientName: clientInfo.clientName,
        clientId: clientInfo.clientId,
        rmName: clientInfo.rmName,
        status: clientInfo.status,
        reportTitle: 'Transaction History'
    });
};

/**
 * Export Ledger data to XLSX
 */
export const exportLedgerToXLSX = (
    ledgerEntries: any[],
    clientInfo: {
        clientName: string;
        clientId: string;
        rmName?: string;
        status?: string;
    }
) => {
    const headers = [
        'Date',
        'Particulars',
        'Voucher No',
        'Type',
        'Debit',
        'Credit',
        'Balance',
        'Cost Center'
    ];

    const data = ledgerEntries.map(entry => [
        entry.date || '',
        entry.particulars || '',
        entry.voucherNo || '',
        entry.transType || entry.type || '',
        entry.debit || '0',
        entry.credit || '0',
        entry.balance || '0',
        entry.costCenter || ''
    ]);

    exportToXLSX(data, headers, {
        fileName: `ledger_${clientInfo.clientId}_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'Ledger',
        clientName: clientInfo.clientName,
        clientId: clientInfo.clientId,
        rmName: clientInfo.rmName,
        status: clientInfo.status,
        reportTitle: 'Ledger Report'
    });
};
