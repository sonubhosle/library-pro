import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle2, AlertCircle, Receipt } from 'lucide-react';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

const InvoiceModal = ({ isOpen, onClose, invoiceData }) => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [collectingPayment, setCollectingPayment] = useState(false);

    if (!isOpen || !invoiceData) return null;

    const { invoice, student, issue, book, fine } = invoiceData;
    const invoiceType = invoice.invoice_type || (fine?.type === 'lost_book' ? 'lost_book' : 'return_receipt');

    const getItemRate = (item) => {
        const desc = item.description.toLowerCase();
        if (desc.includes('book return')) {
            return '₹0.00';
        }
        if (desc.includes('lost book')) {
            const price = book?.price || fine?.book_price || item.amount;
            return `₹${price}.00`;
        }
        if (desc.includes('late return') || desc.includes('late fine')) {
            const perDay = fine?.per_day_charge || 10;
            return `₹${perDay}.00 / Day`;
        }
        return `₹${item.amount}.00`;
    };

    const getItemQty = (item) => {
        const desc = item.description.toLowerCase();
        if (desc.includes('book return')) {
            return '1';
        }
        if (desc.includes('lost book')) {
            return '1';
        }
        if (desc.includes('late return') || desc.includes('late fine')) {
            const days = fine?.late_days || fine?.daysLate || 0;
            if (days > 0) return `${days} Days`;
            const match = item.description.match(/(\d+)\s*Days?/i);
            if (match) return `${match[1]} Days`;
            return '—';
        }
        return '1';
    };

    const handleCollectPayment = async () => {
        if (!invoice.fine_id) {
            addToast('No fine associated with this invoice', 'error');
            return;
        }

        setCollectingPayment(true);
        const result = await window.electron.ipc.invoke('fines:collectPayment', {
            fineId: invoice.fine_id,
            amount: invoice.total,
            adminId: user.id || user._id,
            notes: `Payment collected from invoice ${invoice.invoice_number}`
        });
        setCollectingPayment(false);

        if (result.success) {
            addToast('Payment collected successfully', 'success');
            // Update invoice status in display
            invoiceData.invoice.is_paid = 1;
            // Re-render by triggering a state update in parent if needed
        } else {
            addToast(result.error || 'Failed to collect payment', 'error');
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('invoice-print-area');
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Quick reset after print hack
    };

    const handleExportPdf = async () => {
        const printContent = document.getElementById('invoice-print-area').innerHTML;
        // Clean up the HTML for PDF export with a professional template
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
                        h1, h2, h3, h4, p { margin: 0; }
                        .text-right { text-align: right; }
                        .text-gray { color: #64748b; }
                        .text-teal { color: #0d9488; }
                        .font-bold { font-weight: 700; }
                        .font-black { font-weight: 900; }
                        
                        .header { text-align: center; margin-bottom: 20px; }
                        .library-info p.yuvak { font-size: 12px; color: #1e40af; margin-bottom: 2px; }
                        .library-info h1 { font-size: 28px; color: #f59e0b; margin-bottom: 5px; font-weight: 900; }
                        .library-info p.address { font-size: 12px; color: #1e40af; font-weight: 600; margin-bottom: 2px; }
                        .library-info p.affiliated { font-size: 10px; color: #1e40af; font-weight: 700; margin-bottom: 2px; }
                        .library-info p.codes { font-size: 10px; color: #1e40af; font-weight: 700; word-spacing: 15px; }

                        .invoice-meta { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; }
                        .invoice-title h2 { font-size: 28px; color: #0f172a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0; }
                        .invoice-title p { font-size: 14px; font-weight: 600; color: #64748b; margin-top: 4px; }

                        .details-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .details-box { width: 31%; }
                        .details-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
                        .details-content h3 { font-size: 14px; color: #0f172a; margin-bottom: 4px; font-weight: 700; }
                        .details-content p { font-size: 12px; color: #475569; margin-bottom: 2px; }

                        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .table th { background-color: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
                        .table th.right { text-align: right; }
                        .table td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                        .table td.right { text-align: right; }
                        .item-title { font-weight: 600; color: #0f172a; margin-bottom: 4px; }
                        .item-desc { font-size: 12px; color: #64748b; }

                        .summary-container { width: 100%; display: flex; justify-content: flex-end; }
                        .summary-table { width: 300px; border-collapse: collapse; }
                        .summary-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
                        .summary-table .label { text-align: right; color: #64748b; }
                        .summary-table .value { text-align: right; font-weight: 600; color: #0f172a; }
                        .summary-table .total-row td { border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 16px; }
                        .summary-table .total-label { font-size: 16px; font-weight: 700; color: #0f172a; }
                        .summary-table .total-value { font-size: 20px; font-weight: 900; color: #0d9488; }

                        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; }
                        .footer h4 { font-size: 14px; color: #0f172a; margin-bottom: 4px; }
                        .footer p { font-size: 12px; color: #64748b; }
                        
                        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                        .badge.paid { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
                        .badge.unpaid { background-color: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
                        .badge.returned { background-color: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4; margin-left: 6px; }
                        .badge.lost { background-color: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; margin-left: 6px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="library-info">
                            <p class="yuvak">YUVAK PRATISHTHAN'S</p>
                            <h1>MIT COLLEGE OF COMPUTER SCI. & I.T.</h1>
                            <p class="address">Socity Market, Basmath Tq. Basmath Dist. Hingoli PIN : 431512</p>
                            <p class="affiliated">AFFILIATED TO SRTMU, NANDED & APPROVED BY GOVT. OF MAHARASHTRA & AICTE</p>
                            <p class="codes">DTE CODE: 2748 &nbsp;&nbsp;&nbsp; COLLEGE CODE: 264 &nbsp;&nbsp;&nbsp; AISHE CODE : C-7542</p>
                        </div>
                    </div>

                    <div class="invoice-meta">
                        <div>
                            <div style="margin-top: 5px;">
                                <span class="badge ${invoice.is_paid ? 'paid' : 'unpaid'}">
                                    ${invoice.is_paid ? 'PAID' : 'UNPAID'}
                                </span>
                                <span class="badge ${invoiceType === 'lost_book' ? 'lost' : 'returned'}">
                                    ${invoiceType === 'lost_book' ? 'LOST BOOK' : 'RETURNED'}
                                </span>
                            </div>
                        </div>
                        <div class="invoice-title text-right">
                            <h2>INVOICE</h2>
                            <p># ${invoice.invoice_number}</p>
                        </div>
                    </div>

                    <div class="details-section">
                        <div class="details-box">
                            <div class="details-label">Student Details</div>
                            <div class="details-content">
                                <h3>${student?.name || 'Unknown Student'}</h3>
                                <p><span class="font-bold">Code:</span> ${student?.student_code || 'N/A'}</p>
                                <p><span class="font-bold">Roll No:</span> ${student?.roll_number || 'N/A'}</p>
                                <p><span class="font-bold">Class/Year:</span> ${student?.class || 'N/A'}${student?.year ? ` - ${student.year} Yr` : ''}</p>
                                <p><span class="font-bold">Email:</span> ${student?.email || 'N/A'}</p>
                                <p><span class="font-bold">Phone:</span> ${student?.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="details-box">
                            <div class="details-label">Book Details</div>
                            <div class="details-content">
                                <h3>${book?.title || 'Unknown Book'}</h3>
                                <p><span class="font-bold">Book Code:</span> ${book?.book_code || 'N/A'}</p>
                                <p><span class="font-bold">Author:</span> ${book?.author || 'N/A'}</p>
                                <p><span class="font-bold">ISBN:</span> ${book?.isbn || 'N/A'}</p>
                                <p><span class="font-bold">Category:</span> ${book?.category || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="details-box">
                            <div class="details-label">Issue Details</div>
                            <div class="details-content">
                                <p><span class="font-bold">Issue Code:</span> ${issue?.issue_code || 'N/A'}</p>
                                <p><span class="font-bold">Issue Date:</span> ${issue?.issue_date ? new Date(issue.issue_date * 1000).toLocaleDateString() : 'N/A'}</p>
                                <p><span class="font-bold">Due Date:</span> ${issue?.due_date ? new Date(issue.due_date * 1000).toLocaleDateString() : 'N/A'}</p>
                                <p><span class="font-bold">${invoiceType === 'lost_book' ? 'Lost Date' : 'Return Date'}:</span> ${invoiceType === 'lost_book'
                ? (invoice.generated_at ? new Date(invoice.generated_at * 1000).toLocaleDateString() : new Date().toLocaleDateString())
                : (issue?.return_date ? new Date(issue.return_date * 1000).toLocaleDateString() : (invoice.generated_at ? new Date(invoice.generated_at * 1000).toLocaleDateString() : new Date().toLocaleDateString()))
            }</p>
                                <p><span class="font-bold">Status:</span> ${invoiceType === 'lost_book' ? 'Lost Book' : 'Returned'}</p>
                            </div>
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description / Item</th>
                                <th class="right">Rate</th>
                                <th class="right">Qty/Days</th>
                                <th class="right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(invoice.line_items && invoice.line_items.length > 0) ?
                invoice.line_items.map(item => `
                                    <tr>
                                        <td>
                                            <div class="item-title">${item.description}</div>
                                            <div class="item-desc">
                                                ${(item.description.toLowerCase().includes('return') || item.description.toLowerCase().includes('lost')) && book?.title
                        ? `Book: ${book.title} | Author: ${book.author || 'N/A'}`
                        : 'Fee applied'
                    }
                                            </div>
                                        </td>
                                        <td class="right text-gray">${getItemRate(item)}</td>
                                        <td class="right text-gray">${getItemQty(item)}</td>
                                        <td class="right">₹${item.amount}.00</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td>
                                            <div class="item-title">Book Return: ${book?.title || 'Unknown Book'}</div>
                                            <div class="item-desc">Author: ${book?.author || 'N/A'} | ISBN/Code: ${book?.book_code || 'N/A'}</div>
                                        </td>
                                        <td class="right text-gray">₹0.00</td>
                                        <td class="right text-gray">1</td>
                                        <td class="right">₹0.00</td>
                                    </tr>
                                    ${fine?.totalFine > 0 ? `
                                    <tr>
                                        <td>
                                            <div class="item-title">${fine.type === 'lost_book' ? 'Lost Book Charge + Penalty' : 'Late Return Fine'}</div>
                                            <div class="item-desc">Penalty applied for policy violation</div>
                                        </td>
                                        <td class="right text-gray">${fine.type === 'lost_book' ? `₹${fine.book_price || book?.price || fine.totalFine}.00` : `₹${fine.per_day_charge || 10}.00 / Day`}</td>
                                        <td class="right text-gray">${fine.type === 'lost_book' ? '1' : `${fine.late_days || fine.daysLate || 0} Days`}</td>
                                        <td class="right">₹${fine.totalFine}.00</td>
                                    </tr>
                                    ` : ''}
                                `
            }
                        </tbody>
                    </table>

                    <div style="display: flex; justify-content: flex-end;">
                        <table class="summary-table">
                            <tr>
                                <td class="label">Subtotal</td>
                                <td class="value">₹${invoice.subtotal || invoice.total}.00</td>
                            </tr>
                            <tr>
                                <td class="label">Tax (0%)</td>
                                <td class="value">₹0.00</td>
                            </tr>
                            <tr class="total-row">
                                <td class="label total-label">Grand Total</td>
                                <td class="value total-value">₹${invoice.total}.00</td>
                            </tr>
                        </table>
                    </div>

                    <div class="footer">
                        <h4>Thank you for using the Library!</h4>
                        <p>This is a computer generated invoice and does not require a physical signature.</p>
                        
                        <div style="display: flex; justify-content: space-between; margin-top: 80px; padding: 0 20px;">
                            <div style="text-align: center;">
                                <div style=" width: 160px; margin: 0 auto; padding-top: 8px;">
                                    <strong>Signature of Librarian</strong>
                                </div>
                            </div>
                            <div style="text-align: center;">
                                <div style=" width: 160px; margin: 0 auto; padding-top: 8px;">
                                    <strong>Signature of Principal</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        try {
            const res = await window.electron.ipc.invoke('invoices:exportPdf', { html, fileName: `${invoice.invoice_number}.pdf` });
            if (res.success) {
                addToast('Invoice saved as PDF', 'success');
            }
        } catch (e) {
            addToast('Failed to export PDF', 'error');
        }
    };

    return (
        <div className="fixed inset-0 -top-10 z-50 flex flex-col bg-white animate-fade-in overflow-hidden h-screen w-screen">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 w-full">
                <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Invoice Preview</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Printable Content Container */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 py-8 px-4 w-full">
                <div className="bg-white max-w-4xl mx-auto p-8 rounded-3xl shadow-xl border border-slate-100" id="invoice-print-area">
                    {/* Header: Library Info & Invoice Title */}
                    <div className="text-center mb-6">
                        <p className="text-[#1e40af] text-sm font-medium">YUVAK PRATISHTHAN'S</p>
                        <h1 className="text-3xl font-black text-[#f59e0b] tracking-tight mt-1 mb-1">MIT COLLEGE OF COMPUTER SCI. & I.T.</h1>
                        <p className="text-[#1e40af] text-xs font-semibold">Socity Market, Basmath Tq. Basmath Dist. Hingoli PIN : 431512</p>
                        <p className="text-[#1e40af] text-[10px] font-bold mt-0.5">AFFILIATED TO SRTMU, NANDED & APPROVED BY GOVT. OF MAHARASHTRA & AICTE</p>
                        <p className="text-[#1e40af] text-[10px] font-bold mt-0.5 space-x-6">
                            <span>DTE CODE: 2748</span>
                            <span>COLLEGE CODE: 264</span>
                            <span>AISHE CODE : C-7542</span>
                        </p>
                    </div>

                    <div className="flex justify-between items-end border-b-2 border-slate-100 pb-6 mb-8">
                        <div>
                            <div className="flex gap-2 mb-1">
                                {invoice.is_paid ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                                        <CheckCircle2 size={14} /> PAID
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 shadow-sm">
                                        <AlertCircle size={14} /> UNPAID
                                    </span>
                                )}
                                {invoiceType === 'lost_book' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                                        LOST BOOK
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
                                        RETURNED
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-black text-slate-800 tracking-widest uppercase leading-none">INVOICE</h2>
                            <p className="text-sm font-bold text-slate-500 mt-1"># {invoice.invoice_number}</p>
                        </div>
                    </div>

                    {/* Details Section: Student, Book & Issue */}
                    <div className="grid grid-cols-3 gap-6 mb-10">
                        {/* Student Details */}
                        <div>
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Student Details</h4>
                            <h3 className="text-base font-black text-slate-800">{student?.name || 'Unknown Student'}</h3>
                            <div className="space-y-1 mt-2">
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Code:</span> {student?.student_code || 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Roll No:</span> {student?.roll_number || 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Class/Year:</span> {student?.class || 'N/A'}{student?.year ? ` - ${student.year} Yr` : ''}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Email:</span> {student?.email || 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Phone:</span> {student?.phone || 'N/A'}</p>
                            </div>
                        </div>
                        {/* Book Details */}
                        <div>
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Book Details</h4>
                            <h3 className="text-base font-black text-slate-800">{book?.title || 'Unknown Book'}</h3>
                            <div className="space-y-1 mt-2">
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Book Code:</span> {book?.book_code || 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Author:</span> {book?.author || 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">ISBN:</span> {book?.isbn || 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Category:</span> {book?.category || 'N/A'}</p>
                            </div>
                        </div>
                        {/* Issue & Transaction Details */}
                        <div>
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Issue & Status</h4>
                            <div className="space-y-1 mt-2">
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Issue Code:</span> {issue?.issue_code || 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Issue Date:</span> {issue?.issue_date ? new Date(issue.issue_date * 1000).toLocaleDateString() : 'N/A'}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Due Date:</span> {issue?.due_date ? new Date(issue.due_date * 1000).toLocaleDateString() : 'N/A'}</p>
                                {invoiceType === 'lost_book' ? (
                                    <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Lost Date:</span> {invoice.generated_at ? new Date(invoice.generated_at * 1000).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                ) : (
                                    <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Return Date:</span> {issue?.return_date ? new Date(issue.return_date * 1000).toLocaleDateString() : (invoice.generated_at ? new Date(invoice.generated_at * 1000).toLocaleDateString() : new Date().toLocaleDateString())}</p>
                                )}
                                <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Status:</span> {invoiceType === 'lost_book' ? 'Lost Book' : 'Returned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8 rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Description / Item</th>
                                    <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Rate</th>
                                    <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Qty/Days</th>
                                    <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.line_items && invoice.line_items.length > 0 ? (
                                    invoice.line_items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-4 px-5">
                                                <p className="font-bold text-slate-800 text-sm">{item.description}</p>
                                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                                    {(item.description.toLowerCase().includes('return') || item.description.toLowerCase().includes('lost')) && book?.title
                                                        ? `Book: ${book.title} | Author: ${book.author || 'N/A'}`
                                                        : 'Fee applied'
                                                    }
                                                </p>
                                            </td>
                                            <td className="py-4 px-5 text-right text-slate-500 text-sm font-medium">{getItemRate(item)}</td>
                                            <td className="py-4 px-5 text-right text-slate-500 text-sm font-medium">{getItemQty(item)}</td>
                                            <td className="py-4 px-5 text-right font-bold text-slate-800 text-sm">₹{item.amount}.00</td>
                                        </tr>
                                    ))
                                ) : (
                                    <>
                                        <tr>
                                            <td className="py-4 px-5">
                                                <p className="font-bold text-slate-800 text-sm">Book Return: {book?.title || 'Unknown Book'}</p>
                                                <p className="text-xs text-slate-500 mt-1 font-medium">Author: {book?.author || 'N/A'} | ISBN/Code: {book?.book_code || 'N/A'}</p>
                                            </td>
                                            <td className="py-4 px-5 text-right text-slate-500 text-sm font-medium">₹0.00</td>
                                            <td className="py-4 px-5 text-right text-slate-500 text-sm font-medium">1</td>
                                            <td className="py-4 px-5 text-right font-bold text-slate-800 text-sm">₹0.00</td>
                                        </tr>
                                        {fine?.totalFine > 0 && (
                                            <tr>
                                                <td className="py-4 px-5">
                                                    <p className="font-bold text-rose-600 text-sm">{fine.type === 'lost_book' ? 'Lost Book Charge + Penalty' : 'Late Return Fine'}</p>
                                                    <p className="text-xs text-slate-500 mt-1 font-medium">Penalty applied for policy violation</p>
                                                </td>
                                                <td className="py-4 px-5 text-right text-slate-500 text-sm font-medium">
                                                    {fine.type === 'lost_book' ? `₹${fine.book_price || book?.price || fine.totalFine}.00` : `₹${fine.per_day_charge || 10}.00 / Day`}
                                                </td>
                                                <td className="py-4 px-5 text-right text-slate-500 text-sm font-medium">
                                                    {fine.type === 'lost_book' ? '1' : `${fine.late_days || fine.daysLate || 0} Days`}
                                                </td>
                                                <td className="py-4 px-5 text-right font-bold text-rose-600 text-sm">₹{fine.totalFine}.00</td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary & Totals */}
                    <div className="flex justify-end">
                        <div className="w-72">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-500">Subtotal</span>
                                <span className="text-sm font-bold text-slate-800">₹{invoice.subtotal || invoice.total}.00</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-500">Tax (0%)</span>
                                <span className="text-sm font-bold text-slate-800">₹0.00</span>
                            </div>
                            <div className="flex justify-between py-4 mt-1">
                                <span className="text-base font-black text-slate-800 uppercase tracking-widest">Grand Total</span>
                                <span className="text-2xl font-black text-teal-600">₹{invoice.total}.00</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Required Banner */}
                    {!invoice.is_paid && invoice.total > 0 && (
                        <div className="mt-8 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-center gap-3 shadow-sm">
                            <AlertCircle className="text-amber-500" size={20} />
                            <div>
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Payment Pending</p>
                                <p className="text-sm font-medium text-amber-600">Please process the payment to clear this fine.</p>
                            </div>
                        </div>
                    )}

                    {/* Print Footer */}
                    <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                        <div className="flex justify-between items-end mt-10 mb-12 px-8">
                            <div className="text-center">
                                <div className="w-40 mx-auto pt-2">
                                    <p className="font-bold text-slate-800 text-sm">Signature of Librarian</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="w-40 mx-auto pt-2">
                                    <p className="font-bold text-slate-800 text-sm">Signature of Principal</p>
                                </div>
                            </div>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm mt-6">Thank you for using the Library!</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">This is a computer generated invoice and does not require a physical signature.</p>
                    </div>

                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 w-full flex items-center justify-center">
                <div className="flex items-center justify-end gap-3 w-full max-w-4xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleExportPdf}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-700 transition-all active:scale-95"
                    >
                        <Download size={18} />
                        Save PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 active:scale-95 transition-all"
                    >
                        <Printer size={18} />
                        Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
