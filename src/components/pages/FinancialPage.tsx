import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Edit2,
  FileText,
  Filter,
  X,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Check,
} from 'lucide-react';
import { FinancialTransaction, FinancialType, FinancialDateType, LoanInstallment } from '../../types';
import {
  formatJalaliFull,
  formatJalaliShort,
  getJalaliWeekdayName,
  toPersianDigits,
  parseDateToJalali,
  jalaliToGregorian,
  getJalaliDaysInMonth,
  formatISODateOnly,
} from '../../utils/jalali';
import { JalaliDatePickerModal } from '../common/JalaliDatePickerModal';
import { TimePickerModal } from '../common/TimePickerModal';
import { DetailedModal } from '../common/DetailedModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface FinancialPageProps {
  financials: FinancialTransaction[];
  loans: LoanInstallment[];
  filterStart?: string;
  filterEnd?: string;
  onUpdateFilterDates?: (start: string, end: string) => void;
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'createdAtISO' | 'dayOfWeekName'>) => void;
  onUpdateTransaction: (tx: FinancialTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddLoan: (loan: Omit<LoanInstallment, 'id' | 'createdAtISO'>) => void;
  onUpdateLoan: (loan: LoanInstallment) => void;
  onDeleteLoan: (id: string) => void;
}

export const FinancialPage: React.FC<FinancialPageProps> = ({
  financials,
  loans,
  filterStart,
  filterEnd,
  onUpdateFilterDates,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
}) => {
  // Tab view: Transactions or Loans
  const [activeTab, setActiveTab] = useState<'transactions' | 'loans'>('transactions');

  // Transaction Form State
  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<FinancialType>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [dateType, setDateType] = useState<FinancialDateType>('realtime');
  const [customDateISO, setCustomDateISO] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [customTimeStr, setCustomTimeStr] = useState<string>('12:00');
  const [summary, setSummary] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');

  // Loan Form State
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [loanTitle, setLoanTitle] = useState('');
  const [loanTotalAmount, setLoanTotalAmount] = useState<number>(0);
  const [loanMonthlyAmount, setLoanMonthlyAmount] = useState<number>(0);
  const [loanRemainingPayments, setLoanRemainingPayments] = useState<number>(12);
  const [loanDueDateStr, setLoanDueDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loanStatus, setLoanStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');

  // Filter Date Range for Transactions (synced with appState props)
  const filterStartDate = filterStart || '';
  const filterEndDate = filterEnd || '';

  // Range Filter Modal state
  const [showRangeFilterModal, setShowRangeFilterModal] = useState(false);
  const [tempFilterStart, setTempFilterStart] = useState(filterStartDate);
  const [tempFilterEnd, setTempFilterEnd] = useState(filterEndDate);

  // Active Date Picker
  const [datePickerTarget, setDatePickerTarget] = useState<'customTx' | 'filterStart' | 'filterEnd' | 'loanDue' | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  // Modals
  const [detailedModalTx, setDetailedModalTx] = useState<FinancialTransaction | null>(null);
  const [mobileModalTx, setMobileModalTx] = useState<FinancialTransaction | null>(null);
  const [mobileModalLoan, setMobileModalLoan] = useState<LoanInstallment | null>(null);

  // Confirm Delete Targets
  const [deleteTargetTx, setDeleteTargetTx] = useState<{ id: string; title: string } | null>(null);
  const [deleteTargetLoan, setDeleteTargetLoan] = useState<{ id: string; title: string } | null>(null);

  const resetTxForm = () => {
    setTitle('');
    setType('expense');
    setAmount(0);
    setDateType('realtime');
    setCustomDateISO(new Date().toISOString().slice(0, 10));
    setCustomTimeStr('12:00');
    setSummary('');
    setDetailedDescription('');
    setEditingTxId(null);
    setShowTxForm(false);
  };

  const resetLoanForm = () => {
    setLoanTitle('');
    setLoanTotalAmount(0);
    setLoanMonthlyAmount(0);
    setLoanRemainingPayments(12);
    setLoanDueDateStr(new Date().toISOString().slice(0, 10));
    setLoanStatus('pending');
    setEditingLoanId(null);
    setShowLoanForm(false);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      alert('لطفاً عنوان و مبلغ معتبر وارد کنید.');
      return;
    }

    const targetDateISO = dateType === 'realtime' ? new Date().toISOString().slice(0, 10) : customDateISO;
    const targetTimeStr =
      dateType === 'realtime'
        ? new Date().toTimeString().slice(0, 5)
        : customTimeStr;

    if (editingTxId) {
      const existing = financials.find((f) => f.id === editingTxId);
      if (existing) {
        onUpdateTransaction({
          ...existing,
          title: title.trim(),
          type,
          amount,
          dateType,
          dateISO: targetDateISO,
          timeStr: targetTimeStr,
          dayOfWeekName: getJalaliWeekdayName(targetDateISO),
          summary: summary.trim(),
          detailedDescription: detailedDescription.trim(),
        });
      }
    } else {
      onAddTransaction({
        title: title.trim(),
        type,
        amount,
        dateType,
        dateISO: targetDateISO,
        timeStr: targetTimeStr,
        summary: summary.trim(),
        detailedDescription: detailedDescription.trim(),
      });
    }

    resetTxForm();
  };

  const handleConfirmDeleteTransaction = (id: string, txTitle?: string) => {
    setDeleteTargetTx({ id, title: txTitle || 'این تراکنش' });
  };

  const handleConfirmDeleteLoan = (id: string, loanTitle?: string) => {
    setDeleteTargetLoan({ id, title: loanTitle || 'این وام/قسط' });
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanTitle.trim() || loanTotalAmount <= 0) {
      alert('لطفاً عنوان و مبلغ کل قسط را وارد کنید.');
      return;
    }

    if (editingLoanId) {
      const existing = loans.find((l) => l.id === editingLoanId);
      if (existing) {
        onUpdateLoan({
          ...existing,
          title: loanTitle.trim(),
          totalAmount: loanTotalAmount,
          monthlyAmount: loanMonthlyAmount,
          remainingPayments: loanRemainingPayments,
          dueDateStr: loanDueDateStr,
          status: loanStatus,
        });
      }
    } else {
      onAddLoan({
        title: loanTitle.trim(),
        totalAmount: loanTotalAmount,
        monthlyAmount: loanMonthlyAmount,
        remainingPayments: loanRemainingPayments,
        dueDateStr: loanDueDateStr,
        status: loanStatus,
      });
    }

    resetLoanForm();
  };

  // Filtered Transactions
  const filteredFinancials = useMemo(() => {
    return financials.filter((f) => {
      if (filterStartDate && f.dateISO < filterStartDate) return false;
      if (filterEndDate && f.dateISO > filterEndDate) return false;
      return true;
    });
  }, [financials, filterStartDate, filterEndDate]);

  // Financial Stats
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredFinancials.forEach((f) => {
      if (f.type === 'income') income += f.amount;
      else expense += f.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredFinancials]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-teal-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-right gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-right w-full md:w-auto">
            <div className="inline-flex items-center justify-center gap-3 px-5 py-3 bg-white/15 backdrop-blur-md rounded-2xl text-base sm:text-lg md:text-xl font-black text-white shadow-inner border border-white/20 select-none text-center">
              <Sparkles className="w-6 h-6 text-sky-300 animate-pulse shrink-0" />
              <span>مدیریت مالی، بودجه و اقساط شخصی</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                resetTxForm();
                setShowTxForm(!showTxForm);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95 border border-sky-200/20"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت تراکنش جدید</span>
            </button>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">کل درآمد ثبت‌شده</span>
            <div className="text-lg font-black text-emerald-700 mt-1">
              {toPersianDigits(totals.income.toLocaleString())} <span className="text-xs text-slate-400">تومان</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">کل هزینه‌ها</span>
            <div className="text-lg font-black text-rose-700 mt-1">
              {toPersianDigits(totals.expense.toLocaleString())} <span className="text-xs text-slate-400">تومان</span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white rounded-3xl p-5 border border-teal-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">موجودی خالص</span>
            <div className={`text-lg font-black mt-1 ${totals.balance >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
              {toPersianDigits(totals.balance.toLocaleString())} <span className="text-xs text-slate-400">تومان</span>
            </div>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TAB SWITCHER: Transactions vs Loans */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-2 shadow-xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-3 text-xs font-bold rounded-2xl transition-all ${
            activeTab === 'transactions'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          تراکنش‌های مالی
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`flex-1 py-3 text-xs font-bold rounded-2xl transition-all ${
            activeTab === 'loans'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          اقساط و تسهیلات
        </button>
      </div>

      {/* --- ADD TRANSACTION FORM MODAL --- */}
      {showTxForm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-7 border border-blue-500/20 shadow-2xl shadow-indigo-950/10 space-y-6 text-xs my-auto transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                    {editingTxId ? 'ویرایش تراکنش مالی' : 'ثبت تراکنش مالی جدید'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    جزئیات مالی را برای ثبت دقیق‌تر در جدول وارد کنید
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={resetTxForm} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleTxSubmit} className="space-y-5 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Title */}
                <div>
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    عنوان تراکنش <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: حقوق ماهانه، خریدهای روزانه، اجاره خانه..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    نوع تراکنش
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FinancialType)}
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="expense">هزینه (پرداختی)</option>
                    <option value="income">درآمد (دریافتی)</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    مبلغ (تومان) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="مثال: 500000"
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none dir-ltr text-right transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Date Type */}
                <div>
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    نوع تاریخ ثبت
                  </label>
                  <select
                    value={dateType}
                    onChange={(e) => setDateType(e.target.value as FinancialDateType)}
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="realtime">تاریخ به‌روز (ثبت خودکار ساعت و تاریخ امروز)</option>
                    <option value="custom">تاریخ سفارشی (قابل ویرایش با نشانگر ویژه)</option>
                  </select>
                </div>

                {/* Custom Date & Time options if dateType === 'custom' */}
                {dateType === 'custom' && (
                  <>
                    <div>
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        انتخاب تاریخ سفارشی
                      </label>
                      <button
                        type="button"
                        onClick={() => setDatePickerTarget('customTx')}
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-between hover:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                      >
                        <span>{formatJalaliFull(customDateISO)}</span>
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>

                    <div>
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        انتخاب ساعت دقیق
                      </label>
                      <button
                        type="button"
                        onClick={() => setTimePickerOpen(true)}
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-between dir-ltr text-right hover:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                      >
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{toPersianDigits(customTimeStr)}</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Summary */}
                <div className="sm:col-span-2">
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    توضیحات خلاصه <span className="text-slate-400 font-normal">(نمایش کوتاه در جدول)</span>
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="مثال: چند کلمه خلاصه برای جدول..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Detailed Description */}
                <div className="sm:col-span-2">
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    توضیحات تکمیلی و مفصل
                  </label>
                  <textarea
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    rows={3}
                    placeholder="شماره پیگیری، بابت چه چیزی، نام فروشگاه یا بانک..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none resize-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetTxForm}
                  className="px-5 py-2.5 font-bold text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer"
                >
                  {editingTxId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingTxId ? 'ذخیره تغییرات' : 'ثبت در جدول مالی'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- TAB 1: TRANSACTIONS TABLE --- */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden space-y-3 p-4">
          {/* Date Range Filter Banner & Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/70 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">فیلتر بازه زمانی تراکنش‌ها</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {(filterStartDate || filterEndDate)
                    ? `محدود شده به: ${filterStartDate ? formatJalaliShort(filterStartDate) : 'از ابتدا'} تا ${filterEndDate ? formatJalaliShort(filterEndDate) : 'تا انتها'}`
                    : 'در حال حاضر همه تراکنش‌ها نمایش داده می‌شوند'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTempFilterStart(filterStartDate);
                  setTempFilterEnd(filterEndDate);
                  setShowRangeFilterModal(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  (filterStartDate || filterEndDate)
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-blue-300'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {(filterStartDate || filterEndDate)
                    ? `بازه: ${filterStartDate ? formatJalaliShort(filterStartDate) : 'ابتدا'} تا ${filterEndDate ? formatJalaliShort(filterEndDate) : 'انتها'}`
                    : 'تنظیم بازه زمانی فیلتر'}
                </span>
              </button>

              {(filterStartDate || filterEndDate) && (
                <button
                  type="button"
                  onClick={() => onUpdateFilterDates?.('', '')}
                  className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 bg-white rounded-xl transition-all shadow-sm"
                  title="حذف فیلتر و نمایش همه"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {filteredFinancials.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">هیچ تراکنشی یافت نشد.</p>
              <p className="text-xs text-slate-400">با دکمه «ثبت تراکنش جدید»، درآمدها و هزینه‌های خود را ثبت کنید.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gradient-to-r from-blue-50/90 via-blue-50/50 to-indigo-50/70 text-blue-950 font-black border-b border-blue-100">
                    <tr>
                      <th className="p-3.5 text-blue-900">عنوان</th>
                      <th className="p-3.5 text-center text-blue-900">نوع</th>
                      <th className="p-3.5 text-blue-900">مبلغ (تومان)</th>
                      <th className="p-3.5 text-blue-900">تاریخ و روز هفته</th>
                      <th className="p-3.5 text-blue-900">توضیحات خلاصه</th>
                      <th className="p-3.5 text-center text-blue-900">توضیحات تکمیلی</th>
                      <th className="p-3.5 text-center text-blue-900">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredFinancials.map((f) => (
                      <tr key={f.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{f.title}</td>

                        <td className="p-3.5 text-center">
                          {f.type === 'income' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                              درآمد
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-full">
                              هزینه
                            </span>
                          )}
                        </td>

                        <td className={`p-3.5 font-black text-sm ${f.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {toPersianDigits(f.amount.toLocaleString())}
                        </td>

                        {/* Date with Custom Badge & Day of Week */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span>{formatJalaliShort(f.dateISO)}</span>
                            <span className="text-[10px] text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded-md border border-blue-200/60">
                              {f.dayOfWeekName}
                            </span>
                            {f.dateType === 'custom' && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-100 text-indigo-800 font-bold rounded-md" title="تاریخ سفارشی ثبت شده">
                                سفارشی
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 dir-ltr text-right">
                            {toPersianDigits(f.timeStr)}
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-500">{f.summary || '-'}</td>

                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setDetailedModalTx(f)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200/60 inline-flex items-center gap-1 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>مشاهده</span>
                          </button>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTxId(f.id);
                                setTitle(f.title);
                                setType(f.type);
                                setAmount(f.amount);
                                setDateType(f.dateType);
                                setCustomDateISO(f.dateISO);
                                setCustomTimeStr(f.timeStr);
                                setSummary(f.summary);
                                setDetailedDescription(f.detailedDescription);
                                setShowTxForm(true);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                              title="ویرایش"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmDeleteTransaction(f.id, f.title);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE RESPONSIVE LIST */}
              <div className="block lg:hidden divide-y divide-slate-100">
                {filteredFinancials.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setMobileModalTx(f)}
                    className="p-4 hover:bg-slate-50 transition-colors space-y-2.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{f.title}</h4>
                      <span className={`font-black text-xs ${f.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {toPersianDigits(f.amount.toLocaleString())} تومان
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatJalaliShort(f.dateISO)} ({f.dayOfWeekName})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {f.type === 'income' ? 'درآمد' : 'هزینه'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setMobileModalTx(f)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>جزئیات</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDeleteTransaction(f.id, f.title);
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* --- TAB 2: LOANS & INSTALLMENTS TABLE --- */}
      {activeTab === 'loans' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">جدول مدیریت اقساط و تسهیلات</h3>
            <button
              type="button"
              onClick={() => setShowLoanForm(!showLoanForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن قسط جدید</span>
            </button>
          </div>

          {/* ADD LOAN FORM MODAL */}
          {showLoanForm && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
              <div className="relative w-full max-w-lg bg-white rounded-3xl p-7 border border-blue-500/20 shadow-2xl shadow-indigo-950/10 space-y-6 text-xs my-auto transform scale-100 transition-all">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                      <CreditCard className="w-5 h-5 text-blue-600 animate-pulse" />
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                        {editingLoanId ? 'ویرایش قسط یا تسهیلات' : 'افزودن قسط یا تسهیلات جدید'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        اطلاعات وام و بازپرداخت اقساط ماهیانه را وارد کنید
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={resetLoanForm} 
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handleLoanSubmit} className="space-y-5 text-right">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Title */}
                    <div className="sm:col-span-2">
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        عنوان تسهیلات / وام <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={loanTitle}
                        onChange={(e) => setLoanTitle(e.target.value)}
                        placeholder="مثال: وام مسکن، قسط خرید خودرو، وام بانکی..."
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* Total Amount */}
                    <div>
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        مبلغ کل تسهیلات (تومان) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={loanTotalAmount || ''}
                        onChange={(e) => setLoanTotalAmount(Number(e.target.value))}
                        placeholder="مثال: 50000000"
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none dir-ltr text-right transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* Monthly Amount */}
                    <div>
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        مبلغ قسط ماهانه (تومان)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={loanMonthlyAmount || ''}
                        onChange={(e) => setLoanMonthlyAmount(Number(e.target.value))}
                        placeholder="مثال: 2000000"
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none dir-ltr text-right transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* Remaining Payments */}
                    <div>
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        تعداد اقساط باقیمانده
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={loanRemainingPayments}
                        onChange={(e) => setLoanRemainingPayments(Number(e.target.value))}
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none dir-ltr text-right transition-all"
                      />
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        موعد پرداخت بعدی
                      </label>
                      <button
                        type="button"
                        onClick={() => setDatePickerTarget('loanDue')}
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-between hover:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                      >
                        <span>{formatJalaliFull(loanDueDateStr)}</span>
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>

                    {/* Payment Status */}
                    <div className="sm:col-span-2">
                      <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                        وضعیت پرداخت قسط
                      </label>
                      <select
                        value={loanStatus}
                        onChange={(e) => setLoanStatus(e.target.value as any)}
                        className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                      >
                        <option value="pending">در انتظار پرداخت</option>
                        <option value="paid">پرداخت شده</option>
                        <option value="overdue">معوقه</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetLoanForm}
                      className="px-5 py-2.5 font-bold text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer"
                    >
                      {editingLoanId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingLoanId ? 'ذخیره تغییرات قسط' : 'افزودن قسط'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

          {loans.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">
              هیچ وام یا قسطی در این بخش ثبت نشده است.
            </p>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gradient-to-r from-blue-50/90 via-blue-50/50 to-indigo-50/70 text-blue-950 font-black border-b border-blue-100">
                    <tr>
                      <th className="p-3 text-blue-900">عنوان</th>
                      <th className="p-3 text-blue-900">مبلغ کل</th>
                      <th className="p-3 text-blue-900">قسط ماهانه</th>
                      <th className="p-3 text-center text-blue-900">اقساط باقیمانده</th>
                      <th className="p-3 text-blue-900">موعد پرداخت</th>
                      <th className="p-3 text-center text-blue-900">وضعیت</th>
                      <th className="p-3 text-center text-blue-900">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50">
                        <td 
                          className="p-3 font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => setMobileModalLoan(loan)}
                        >
                          {loan.title}
                        </td>
                        <td className="p-3 font-semibold">{toPersianDigits(loan.totalAmount.toLocaleString())} تومان</td>
                        <td className="p-3 font-semibold text-blue-800">{toPersianDigits(loan.monthlyAmount.toLocaleString())} تومان</td>
                        <td className="p-3 text-center font-bold">{toPersianDigits(loan.remainingPayments)} قسط</td>
                        <td className="p-3 font-bold text-slate-700">{formatJalaliShort(loan.dueDateStr)}</td>
                        <td className="p-3 text-center">
                          {loan.status === 'paid' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">پرداخت شده</span>}
                          {loan.status === 'pending' && <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-full">در انتظار</span>}
                          {loan.status === 'overdue' && <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-full">معوقه</span>}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setMobileModalLoan(loan)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200/60 inline-flex items-center gap-1 transition-all"
                              title="مشاهده جزئیات"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>مشاهده</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLoanId(loan.id);
                                setLoanTitle(loan.title);
                                setLoanTotalAmount(loan.totalAmount);
                                setLoanMonthlyAmount(loan.monthlyAmount);
                                setLoanRemainingPayments(loan.remainingPayments);
                                setLoanDueDateStr(loan.dueDateStr);
                                setLoanStatus(loan.status);
                                setShowLoanForm(true);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                              title="ویرایش"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmDeleteLoan(loan.id, loan.title);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE RESPONSIVE LOANS LIST */}
              <div className="block lg:hidden divide-y divide-slate-100">
                {loans.map((loan) => (
                  <div 
                    key={loan.id} 
                    onClick={() => setMobileModalLoan(loan)}
                    className="p-4 space-y-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{loan.title}</h4>
                      <span className="font-black text-xs text-blue-800">
                        {toPersianDigits(loan.totalAmount.toLocaleString())} تومان
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>قسط ماهانه: <span className="font-bold text-slate-900">{toPersianDigits(loan.monthlyAmount.toLocaleString())} ت</span></div>
                      <div>باقیمانده: <span className="font-bold text-slate-900">{toPersianDigits(loan.remainingPayments)} قسط</span></div>
                      <div>موعد: <span className="font-bold text-slate-900">{formatJalaliShort(loan.dueDateStr)}</span></div>
                      <div>
                        وضعیت:{' '}
                        {loan.status === 'paid' && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md">پرداخت شده</span>}
                        {loan.status === 'pending' && <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-md">در انتظار</span>}
                        {loan.status === 'overdue' && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-md">معوقه</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setMobileModalLoan(loan)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>جزئیات</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDeleteLoan(loan.id, loan.title);
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* MOBILE LOAN DETAIL MODAL */}
      {mobileModalLoan && (
        <DetailedModal
          isOpen={Boolean(mobileModalLoan)}
          onClose={() => setMobileModalLoan(null)}
          title={mobileModalLoan.title}
          amount={mobileModalLoan.totalAmount}
          status={mobileModalLoan.status}
          summary={`قسط ماهانه: ${mobileModalLoan.monthlyAmount.toLocaleString()} تومان | اقساط باقیمانده: ${mobileModalLoan.remainingPayments} قسط`}
          detailedDescription={`عنوان وام / تسهیلات: ${mobileModalLoan.title}\nمبلغ کل: ${mobileModalLoan.totalAmount.toLocaleString()} تومان\nمبلغ قسط ماهانه: ${mobileModalLoan.monthlyAmount.toLocaleString()} تومان\nتعداد اقساط باقیمانده: ${mobileModalLoan.remainingPayments}\nموعد پرداخت: ${formatJalaliFull(mobileModalLoan.dueDateStr)}\nوضعیت: ${
            mobileModalLoan.status === 'paid' ? 'پرداخت شده' : mobileModalLoan.status === 'pending' ? 'در انتظار پرداخت' : 'معوقه'
          }`}
          createdDateISO={mobileModalLoan.createdAtISO?.slice(0, 10)}
          deadlineDate={mobileModalLoan.dueDateStr}
          onEdit={() => {
            const target = mobileModalLoan;
            setMobileModalLoan(null);
            setEditingLoanId(target.id);
            setLoanTitle(target.title);
            setLoanTotalAmount(target.totalAmount);
            setLoanMonthlyAmount(target.monthlyAmount);
            setLoanRemainingPayments(target.remainingPayments);
            setLoanDueDateStr(target.dueDateStr);
            setLoanStatus(target.status);
            setShowLoanForm(true);
          }}
          onDelete={() => {
            onDeleteLoan(mobileModalLoan.id);
            setMobileModalLoan(null);
          }}
          readOnly={true}
        />
      )}

      {/* MOBILE DETAIL MODAL */}
      {mobileModalTx && (
        <DetailedModal
          isOpen={Boolean(mobileModalTx)}
          onClose={() => setMobileModalTx(null)}
          title={mobileModalTx.title}
          amount={mobileModalTx.amount}
          type={mobileModalTx.type}
          summary={mobileModalTx.summary}
          detailedDescription={mobileModalTx.detailedDescription}
          createdDateISO={mobileModalTx.dateISO}
          createdTimeStr={mobileModalTx.timeStr}
          onEdit={() => {
            const target = mobileModalTx;
            setMobileModalTx(null);
            setEditingTxId(target.id);
            setTitle(target.title);
            setType(target.type);
            setAmount(target.amount);
            setDateType(target.dateType);
            setCustomDateISO(target.dateISO);
            setCustomTimeStr(target.timeStr);
            setSummary(target.summary);
            setDetailedDescription(target.detailedDescription);
            setShowTxForm(true);
          }}
          onDelete={() => {
            onDeleteTransaction(mobileModalTx.id);
            setMobileModalTx(null);
          }}
          onSave={(newDetailed) => {
            onUpdateTransaction({ ...mobileModalTx, detailedDescription: newDetailed });
          }}
        />
      )}

      {/* DETAILED MODAL */}
      {detailedModalTx && (
        <DetailedModal
          isOpen={Boolean(detailedModalTx)}
          onClose={() => setDetailedModalTx(null)}
          title={detailedModalTx.title}
          amount={detailedModalTx.amount}
          type={detailedModalTx.type}
          summary={detailedModalTx.summary}
          detailedDescription={detailedModalTx.detailedDescription}
          createdDateISO={detailedModalTx.dateISO}
          createdTimeStr={detailedModalTx.timeStr}
          onEdit={() => {
            const target = detailedModalTx;
            setDetailedModalTx(null);
            setEditingTxId(target.id);
            setTitle(target.title);
            setType(target.type);
            setAmount(target.amount);
            setDateType(target.dateType);
            setCustomDateISO(target.dateISO);
            setCustomTimeStr(target.timeStr);
            setSummary(target.summary);
            setDetailedDescription(target.detailedDescription);
            setShowTxForm(true);
          }}
          onDelete={() => {
            onDeleteTransaction(detailedModalTx.id);
            setDetailedModalTx(null);
          }}
          onSave={(newDetailed) => {
            onUpdateTransaction({ ...detailedModalTx, detailedDescription: newDetailed });
          }}
        />
      )}

      {/* DATE RANGE FILTER MODAL */}
      {showRangeFilterModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/15 rounded-xl backdrop-blur">
                  <Calendar className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">انتخاب بازه زمانی تراکنش‌ها</h3>
                  <p className="text-[11px] text-blue-100">نمایش تراکنش‌های مالی در تاریخ‌های مشخص شده</p>
                </div>
              </div>
              <button
                onClick={() => setShowRangeFilterModal(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 bg-slate-50/50">
              {/* Quick Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">میانبرهای سریع:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const j = parseDateToJalali(today);
                      const startG = jalaliToGregorian(j.jy, j.jm, 1);
                      const daysInM = getJalaliDaysInMonth(j.jy, j.jm);
                      const endG = jalaliToGregorian(j.jy, j.jm, daysInM);

                      const startISO = `${startG.gy}-${String(startG.gm).padStart(2, '0')}-${String(startG.gd).padStart(2, '0')}`;
                      const endISO = `${endG.gy}-${String(endG.gm).padStart(2, '0')}-${String(endG.gd).padStart(2, '0')}`;
                      setTempFilterStart(startISO);
                      setTempFilterEnd(endISO);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-xl transition-all"
                  >
                    ماه جاری
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 30);
                      setTempFilterStart(formatISODateOnly(start));
                      setTempFilterEnd(formatISODateOnly(end));
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-xl transition-all"
                  >
                    ۳۰ روز اخیر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const j = parseDateToJalali(today);
                      const startG = jalaliToGregorian(j.jy, 1, 1);
                      const endG = jalaliToGregorian(j.jy, 12, 29);
                      setTempFilterStart(`${startG.gy}-${String(startG.gm).padStart(2, '0')}-${String(startG.gd).padStart(2, '0')}`);
                      setTempFilterEnd(`${endG.gy}-${String(endG.gm).padStart(2, '0')}-${String(endG.gd).padStart(2, '0')}`);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-xl transition-all"
                  >
                    امسال
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempFilterStart('');
                      setTempFilterEnd('');
                    }}
                    className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-medium rounded-xl transition-all"
                  >
                    حذف فیلتر
                  </button>
                </div>
              </div>

              {/* Start and End Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Start Date Card */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">از تاریخ (شروع):</span>
                  <div className="text-xs font-black text-blue-900 leading-relaxed min-h-[2.5rem] flex items-center">
                    {tempFilterStart ? formatJalaliFull(tempFilterStart) : 'از ابتدا (بدون محدودیت)'}
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setDatePickerTarget('filterStart')}
                      className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-blue-200/60"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>انتخاب از تقویم</span>
                    </button>
                    {tempFilterStart && (
                      <button
                        type="button"
                        onClick={() => setTempFilterStart('')}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-xl"
                        title="پاکسازی تاریخ شروع"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* End Date Card */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">تا تاریخ (پایان):</span>
                  <div className="text-xs font-black text-blue-900 leading-relaxed min-h-[2.5rem] flex items-center">
                    {tempFilterEnd ? formatJalaliFull(tempFilterEnd) : 'تا انتها (بدون محدودیت)'}
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setDatePickerTarget('filterEnd')}
                      className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-blue-200/60"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>انتخاب از تقویم</span>
                    </button>
                    {tempFilterEnd && (
                      <button
                        type="button"
                        onClick={() => setTempFilterEnd('')}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-xl"
                        title="پاکسازی تاریخ پایان"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Summary */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-950 font-medium">
                {(tempFilterStart || tempFilterEnd) ? (
                  <span>
                    فیلتر انتخابی: از{' '}
                    <strong className="font-bold">{tempFilterStart ? formatJalaliShort(tempFilterStart) : 'ابتدا'}</strong>{' '}
                    تا{' '}
                    <strong className="font-bold">{tempFilterEnd ? formatJalaliShort(tempFilterEnd) : 'انتها'}</strong>
                  </span>
                ) : (
                  <span>هیچ فیلتر تاریخی تنظیم نشده است (نمایش تمام تراکنش‌ها).</span>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setShowRangeFilterModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateFilterDates?.(tempFilterStart, tempFilterEnd);
                    setShowRangeFilterModal(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>اعمال و ذخیره فیلتر</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* JALALI DATE PICKERS */}
      <JalaliDatePickerModal
        isOpen={Boolean(datePickerTarget)}
        onClose={() => setDatePickerTarget(null)}
        selectedDateISO={
          datePickerTarget === 'customTx'
            ? customDateISO
            : datePickerTarget === 'filterStart'
            ? (showRangeFilterModal ? tempFilterStart || new Date().toISOString().slice(0, 10) : filterStartDate || new Date().toISOString().slice(0, 10))
            : datePickerTarget === 'filterEnd'
            ? (showRangeFilterModal ? tempFilterEnd || new Date().toISOString().slice(0, 10) : filterEndDate || new Date().toISOString().slice(0, 10))
            : loanDueDateStr
        }
        onSelectDate={(iso) => {
          if (datePickerTarget === 'customTx') setCustomDateISO(iso);
          if (datePickerTarget === 'filterStart') {
            setTempFilterStart(iso);
            if (!showRangeFilterModal) {
              onUpdateFilterDates?.(iso, filterEndDate);
            }
          }
          if (datePickerTarget === 'filterEnd') {
            setTempFilterEnd(iso);
            if (!showRangeFilterModal) {
              onUpdateFilterDates?.(filterStartDate, iso);
            }
          }
          if (datePickerTarget === 'loanDue') setLoanDueDateStr(iso);
        }}
      />

      {/* TIME PICKER */}
      <TimePickerModal
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        selectedTime={customTimeStr}
        onSelectTime={(time) => setCustomTimeStr(time)}
      />

      {/* CONFIRM DELETE TRANSACTION MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTargetTx)}
        onClose={() => setDeleteTargetTx(null)}
        onConfirm={() => {
          if (deleteTargetTx) {
            onDeleteTransaction(deleteTargetTx.id);
            setDeleteTargetTx(null);
          }
        }}
        title={`آیا از حذف تراکنش «${deleteTargetTx?.title}» اطمینان دارید؟`}
      />

      {/* CONFIRM DELETE LOAN MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTargetLoan)}
        onClose={() => setDeleteTargetLoan(null)}
        onConfirm={() => {
          if (deleteTargetLoan) {
            onDeleteLoan(deleteTargetLoan.id);
            setDeleteTargetLoan(null);
          }
        }}
        title={`آیا از حذف «${deleteTargetLoan?.title}» اطمینان دارید؟`}
      />
    </div>
  );
};
