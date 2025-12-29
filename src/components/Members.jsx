import React, { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, AlertCircle, Edit2, Trash2, Plus, X, AlertTriangle, Home, MapPin, RefreshCcw } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  DUES_STRUCTURE,
  MEMBER_TYPES,
  MEMBER_STATUS,
  RESIDENCE_TYPE,
  PAYMENT_METHODS,
  calculateDues,
  checkBylawCompliance,
  calculateMemberMetrics,
  isDateInFiscalYear,
  getFiscalYearRange
} from '../utils/helpers';
import storage from '../services/storage';
import CurrencyInput from './CurrencyInput';

function AddMemberModal({ onClose, onSave, existingMembers, member, fiscalYear }) {
  const isEditing = !!member;

  // Default values for all fields
  const defaultValues = {
    name: '',
    type: MEMBER_TYPES.RETURN,
    residence: RESIDENCE_TYPE.INSIDE,
    address: '',
    status: MEMBER_STATUS.FAMILY,
    dues: {
      baseDues: DUES_STRUCTURE.BASE_DUES,
      additionalFees: [
        { type: 'initiation', label: 'New Member Initiation Fee', amount: DUES_STRUCTURE.FEES.INITIATION, applied: false }
      ],
      discounts: [
        { type: 'single_senior', label: 'Single/Senior Discount', amount: DUES_STRUCTURE.DISCOUNTS.SINGLE_SENIOR, applied: false },
        { type: 'initiation_waiver', label: 'Waive Initiation Fee', amount: -DUES_STRUCTURE.FEES.INITIATION, applied: false, reason: '', approvedBy: '', approvalDate: '' }
      ],
      customDiscounts: []
    },
    datePaid: '',
    paymentMethod: PAYMENT_METHODS.ZELLE,
    checkNumber: '',
    hasPaid: false,
    refunded: false,
    refundDate: '',
    refundReason: '',
    refundAmount: 0
  };

  // Merge member data with defaults to ensure all fields are defined
  const [formData, setFormData] = useState(member ? {
    ...defaultValues,
    ...member,
    id: member.id, // Preserve member ID for editing
    name: member.name || '',
    address: member.address || '',
    datePaid: member.datePaid || '',
    paymentMethod: member.paymentMethod || PAYMENT_METHODS.ZELLE,
    checkNumber: member.checkNumber || '',
    hasPaid: !!member.datePaid,
    refunded: member.refunded || false,
    refundDate: member.refundDate || '',
    refundReason: member.refundReason || '',
    refundAmount: member.refundAmount || 0,
    dues: member.dues || defaultValues.dues,
    createdAt: member.createdAt || new Date().toISOString()
  } : defaultValues);

  const [showOtherDiscount, setShowOtherDiscount] = useState(false);
  const [otherDiscountAmount, setOtherDiscountAmount] = useState('');
  const [otherDiscountReason, setOtherDiscountReason] = useState('');

  const [showBylawWarning, setShowBylawWarning] = useState(false);
  const [complianceInfo, setComplianceInfo] = useState(null);
  const [bylawOverride, setBylawOverride] = useState(
    member?.compliance?.bylawOverride
      ? {
          enabled: member.compliance.bylawOverride,
          reason: member.compliance.overrideReason || '',
          approvedBy: member.compliance.overrideApprovedBy || ''
        }
      : { enabled: false, reason: '', approvedBy: '' }
  );
  const [errors, setErrors] = useState([]);
  const [fiscalYearWarning, setFiscalYearWarning] = useState(null);

  // Check compliance when residence changes
  useEffect(() => {
    if (formData.residence === RESIDENCE_TYPE.OUTSIDE) {
      const testMembers = [...existingMembers, { residence: RESIDENCE_TYPE.OUTSIDE }];
      const compliance = checkBylawCompliance(testMembers);
      setComplianceInfo(compliance);
      setShowBylawWarning(!compliance.compliant);
    } else {
      setShowBylawWarning(false);
      setComplianceInfo(null);
    }
  }, [formData.residence, existingMembers]);

  // Auto-apply initiation fee for new members
  useEffect(() => {
    if (formData.type === MEMBER_TYPES.NEW) {
      setFormData(prev => ({
        ...prev,
        dues: {
          ...prev.dues,
          additionalFees: prev.dues.additionalFees.map(f =>
            f.type === 'initiation' ? { ...f, applied: true } : f
          )
        }
      }));
    }
  }, [formData.type]);

  // Check fiscal year when payment or refund dates change
  useEffect(() => {
    if (formData.datePaid && !isDateInFiscalYear(formData.datePaid, fiscalYear)) {
      setFiscalYearWarning({
        type: 'payment',
        message: `Payment date ${formatDate(formData.datePaid)} is outside FY${fiscalYear} (${getFiscalYearRange(fiscalYear)})`
      });
    } else if (formData.refundDate && !isDateInFiscalYear(formData.refundDate, fiscalYear)) {
      setFiscalYearWarning({
        type: 'refund',
        message: `Refund date ${formatDate(formData.refundDate)} is outside FY${fiscalYear} (${getFiscalYearRange(fiscalYear)})`
      });
    } else {
      setFiscalYearWarning(null);
    }
  }, [formData.datePaid, formData.refundDate, fiscalYear]);

  // Calculate dues in real-time, including "Other" discount if active
  const tempCustomDiscounts = showOtherDiscount && otherDiscountAmount
    ? [{
        type: 'other',
        label: 'Other Discount',
        amount: -Math.abs(parseFloat(otherDiscountAmount) || 0),
        applied: true,
        reason: otherDiscountReason
      }]
    : [];

  const calculatedDues = calculateDues(
    formData.dues.baseDues,
    formData.dues.additionalFees,
    formData.dues.discounts,
    tempCustomDiscounts
  );

  const toggleFee = (feeType) => {
    setFormData(prev => ({
      ...prev,
      dues: {
        ...prev.dues,
        additionalFees: prev.dues.additionalFees.map(f =>
          f.type === feeType ? { ...f, applied: !f.applied } : f
        )
      }
    }));
  };

  const toggleDiscount = (discountType) => {
    setFormData(prev => ({
      ...prev,
      dues: {
        ...prev.dues,
        discounts: prev.dues.discounts.map(d =>
          d.type === discountType ? { ...d, applied: !d.applied } : d
        )
      }
    }));
  };

  const updateDiscountReason = (discountType, field, value) => {
    setFormData(prev => ({
      ...prev,
      dues: {
        ...prev.dues,
        discounts: prev.dues.discounts.map(d =>
          d.type === discountType ? { ...d, [field]: value } : d
        )
      }
    }));
  };

  const hasAppliedDiscounts = formData.dues.discounts.some(d => d.applied) || formData.dues.customDiscounts.some(d => d.applied);
  // Only initiation_waiver requires reason/approval, single_senior does not
  const discountsNeedReason = formData.dues.discounts.filter(d => d.applied && d.type !== 'single_senior' && !d.reason).length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 Form submitted with data:', {
      name: formData.name,
      refunded: formData.refunded,
      refundDate: formData.refundDate,
      refundReason: formData.refundReason
    });

    const validationErrors = [];

    if (!formData.name.trim()) {
      validationErrors.push('Member name is required');
    }

    if (discountsNeedReason) {
      validationErrors.push('Discount reason is required for initiation fee waiver');
    }

    if (showOtherDiscount && (!otherDiscountAmount || !otherDiscountReason)) {
      validationErrors.push('Other discount requires both amount and reason');
    }

    if (showBylawWarning && !bylawOverride.enabled) {
      validationErrors.push('Bylaw override is required to add outside members when over the 50% limit');
    }

    if (bylawOverride.enabled && (!bylawOverride.reason || !bylawOverride.approvedBy)) {
      validationErrors.push('Override reason and approval are required when violating bylaw limits');
    }

    if (formData.refunded && !formData.refundReason.trim()) {
      validationErrors.push('Refund reason is required when processing a refund');
    }

    if (formData.refunded && !formData.refundDate) {
      validationErrors.push('Refund date is required when processing a refund');
    }

    if (formData.refunded && (!formData.refundAmount || formData.refundAmount <= 0)) {
      validationErrors.push('Refund amount must be greater than $0');
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    console.log('✅ Validation passed, preparing member data...');

    // Add "Other" custom discount if specified
    const customDiscounts = showOtherDiscount && otherDiscountAmount && otherDiscountReason
      ? [{
          type: 'other',
          label: 'Other Discount',
          amount: -Math.abs(parseFloat(otherDiscountAmount)),
          applied: true,
          reason: otherDiscountReason
        }]
      : [];

    // Prepare member object
    const memberData = {
      id: isEditing ? formData.id : `member_${Date.now()}`, // Preserve ID when editing
      name: formData.name,
      type: formData.type,
      residence: formData.residence,
      address: formData.address,
      status: formData.status,
      newReturn: formData.type, // For backward compatibility
      dues: {
        ...formData.dues,
        customDiscounts,
        ...calculatedDues
      },
      totalRealized: calculatedDues.totalRealized, // For backward compatibility
      datePaid: formData.hasPaid && !formData.refunded ? formData.datePaid : null,
      paymentMethod: formData.hasPaid && !formData.refunded ? formData.paymentMethod : null,
      checkNumber: formData.hasPaid && !formData.refunded && formData.paymentMethod === PAYMENT_METHODS.CHECK ? formData.checkNumber : null,
      refunded: formData.refunded || false,
      refundDate: formData.refunded ? formData.refundDate : null,
      refundReason: formData.refunded ? formData.refundReason : null,
      refundAmount: formData.refunded ? formData.refundAmount : null,
      compliance: {
        residenceVerified: true,
        verificationDate: new Date().toISOString(),
        bylawOverride: bylawOverride.enabled,
        overrideReason: bylawOverride.reason || null,
        overrideApprovedBy: bylawOverride.approvedBy || null
      },
      createdAt: isEditing ? formData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Calling onSave with member data:', {
      id: memberData.id,
      name: memberData.name,
      refunded: memberData.refunded,
      refundDate: memberData.refundDate,
      refundReason: memberData.refundReason,
      refundAmount: memberData.refundAmount,
      datePaid: memberData.datePaid
    });

    onSave(memberData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="overflow-y-auto max-h-[90vh]">
          <div className="sticky top-0 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-[#334155] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-700/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-200 mb-2">Please fix the following errors:</p>
                <ul className="text-sm text-rose-700 dark:text-rose-200 list-disc pl-5 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {fiscalYearWarning && (
              <div className="bg-amber-50 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Fiscal Year Warning
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {fiscalYearWarning.message}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      ⚠️ This transaction will be recorded for FY{fiscalYear}. Make sure this is intentional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Member Information */}
            <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-4 space-y-4 border border-transparent dark:border-[#334155]">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Member Information</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Member Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Smith Family (John & Jane)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Member Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: MEMBER_TYPES.NEW })}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                        formData.type === MEMBER_TYPES.NEW
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border-2 border-blue-500 dark:border-blue-700'
                          : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                      }`}
                    >
                      New Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: MEMBER_TYPES.RETURN })}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                        formData.type === MEMBER_TYPES.RETURN
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 border-2 border-emerald-500 dark:border-emerald-700'
                          : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                      }`}
                    >
                      Returning
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: MEMBER_STATUS.FAMILY })}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                        formData.status === MEMBER_STATUS.FAMILY
                          ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200 border-2 border-violet-500 dark:border-violet-700'
                          : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                      }`}
                    >
                      Family
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: MEMBER_STATUS.SINGLE_SENIOR })}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                        formData.status === MEMBER_STATUS.SINGLE_SENIOR
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200 border-2 border-amber-500 dark:border-amber-700'
                          : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                      }`}
                    >
                      Single/Senior
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Residence *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, residence: RESIDENCE_TYPE.INSIDE })}
                    className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                      formData.residence === RESIDENCE_TYPE.INSIDE
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 border-2 border-emerald-500 dark:border-emerald-700'
                        : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                    }`}
                  >
                    Inside Neighborhood
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, residence: RESIDENCE_TYPE.OUTSIDE })}
                    className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                      formData.residence === RESIDENCE_TYPE.OUTSIDE
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border-2 border-blue-500 dark:border-blue-700'
                        : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                    }`}
                  >
                    Outside Neighborhood
                  </button>
                </div>
              </div>

              {showBylawWarning && complianceInfo && (
                <div className="bg-rose-50 dark:bg-rose-900/40 border-2 border-rose-300 dark:border-rose-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-rose-900 dark:text-rose-200 mb-2">Bylaw Compliance Warning</p>
                      <p className="text-sm text-rose-800 dark:text-rose-200 mb-3">
                        Adding this outside member will exceed the 50% bylaw limit.
                      </p>
                      <div className="text-xs text-rose-700 dark:text-rose-200 space-y-1 mb-3">
                        <p>• Current: {complianceInfo.count.outside - 1} outside / {complianceInfo.count.total} total ({((complianceInfo.count.outside - 1) / complianceInfo.count.total * 100).toFixed(1)}%)</p>
                        <p>• After adding: {complianceInfo.count.outside} outside / {complianceInfo.count.total + 1} total ({(complianceInfo.percentage * 100).toFixed(1)}%)</p>
                        <p>• Over limit by: {complianceInfo.overLimit} members</p>
                      </div>

                      <label className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={bylawOverride.enabled}
                          onChange={(e) => setBylawOverride({ ...bylawOverride, enabled: e.target.checked })}
                          className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                        />
                        <span className="text-sm font-medium text-rose-900 dark:text-rose-200">Override bylaw limit (requires approval)</span>
                      </label>

                      {bylawOverride.enabled && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-rose-900 dark:text-rose-200 mb-1">Override Reason *</label>
                            <textarea
                              value={bylawOverride.reason}
                              onChange={(e) => setBylawOverride({ ...bylawOverride, reason: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-rose-300 dark:border-rose-800 dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-rose-500"
                              rows="2"
                              placeholder="e.g., Board approved exception for immediate family member"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-rose-900 dark:text-rose-200 mb-1">Approved By *</label>
                            <input
                              type="text"
                              value={bylawOverride.approvedBy}
                              onChange={(e) => setBylawOverride({ ...bylawOverride, approvedBy: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-rose-300 dark:border-rose-800 dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-rose-500"
                              placeholder="e.g., Board President, Board Vote 7-0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Lockridge Forest Dr"
                />
              </div>
            </div>

            {/* Dues Calculation */}
            <div className="bg-blue-50 dark:bg-blue-900/40 rounded-xl p-4 space-y-4 border border-transparent dark:border-blue-700/50">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Dues Calculation</h3>

              <div className="bg-white dark:bg-[#0f172a] rounded-lg p-4 border border-transparent dark:border-[#334155]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Base Dues:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(formData.dues.baseDues)}</span>
                </div>

                <div className="border-t border-slate-200 dark:border-[#334155] pt-3 mb-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Additional Fees:</p>
                  {formData.dues.additionalFees.map(fee => (
                    <label key={fee.type} className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#334155] rounded px-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={fee.applied}
                          onChange={() => toggleFee(fee.type)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{fee.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">+{formatCurrency(fee.amount)}</span>
                    </label>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#334155] mt-2">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Subtotal with Fees:</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(calculatedDues.totalValue)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-[#334155] pt-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Discounts:</p>
                  {formData.dues.discounts.map(discount => (
                    <div key={discount.type} className="mb-3">
                      <label className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#334155] rounded px-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={discount.applied}
                            onChange={() => toggleDiscount(discount.type)}
                            className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{discount.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-rose-600 dark:text-rose-300">{formatCurrency(discount.amount)}</span>
                      </label>
                      {discount.applied && discount.type !== 'single_senior' && (
                        <div className="ml-6 mt-2 space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Reason *</label>
                            <input
                              type="text"
                              value={discount.reason}
                              onChange={(e) => updateDiscountReason(discount.type, 'reason', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Board approved at meeting"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Approved By</label>
                              <input
                                type="text"
                                value={discount.approvedBy}
                                onChange={(e) => updateDiscountReason(discount.type, 'approvedBy', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Board"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Approval Date</label>
                              <input
                                type="date"
                                value={discount.approvalDate}
                                onChange={(e) => updateDiscountReason(discount.type, 'approvalDate', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Other Discount */}
                  <div className="mb-3 border-t border-slate-200 dark:border-[#334155] pt-3">
                    <button
                      type="button"
                      onClick={() => setShowOtherDiscount(!showOtherDiscount)}
                      className={`w-full flex items-center justify-between py-2 px-2 rounded hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors ${
                        showOtherDiscount ? 'bg-rose-50 dark:bg-rose-900/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showOtherDiscount}
                          onChange={() => {}}
                          className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 pointer-events-none"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Other Discount</span>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 italic">Custom amount</span>
                    </button>
                    {showOtherDiscount && (
                      <div className="ml-6 mt-2 space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Discount Amount * (enter positive number)</label>
                          <CurrencyInput
                            value={parseFloat(otherDiscountAmount) || 0}
                            onChange={(value) => setOtherDiscountAmount(value.toString())}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            showIcon={true}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Reason *</label>
                          <input
                            type="text"
                            value={otherDiscountReason}
                            onChange={(e) => setOtherDiscountReason(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Family hardship, Board approved"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#334155] mt-2">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Total Discounts:</span>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-300">{formatCurrency(calculatedDues.totalDiscounts)}</span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-300 dark:border-[#334155] pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase">Total Realized Revenue:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">{formatCurrency(calculatedDues.totalRealized)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-4 space-y-4 border border-transparent dark:border-[#334155]">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">Payment Information (Optional)</h3>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasPaid}
                  onChange={(e) => setFormData({ ...formData, hasPaid: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Member has paid</span>
              </label>

              {formData.hasPaid && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date Paid</label>
                    <input
                      type="date"
                      value={formData.datePaid}
                      onChange={(e) => setFormData({ ...formData, datePaid: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(PAYMENT_METHODS).map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  {formData.paymentMethod === PAYMENT_METHODS.CHECK && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Check Number</label>
                      <input
                        type="text"
                        value={formData.checkNumber}
                        onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1234"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Refund Section - Only show if member has paid and not already refunded */}
            {(formData.hasPaid || (isEditing && member && member.datePaid)) && !(isEditing && member && member.refunded) && (
              <div className="bg-rose-50 dark:bg-rose-900/40 rounded-xl p-4 space-y-4 border-2 border-rose-200 dark:border-rose-700/50">
                <h3 className="font-semibold text-rose-900 dark:text-rose-200 text-sm uppercase tracking-wide">Process Refund</h3>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.refunded}
                    onChange={(e) => {
                      const defaultRefundAmount = formData.dues?.totalRealized || calculatedDues.totalRealized;
                      setFormData({
                        ...formData,
                        refunded: e.target.checked,
                        refundDate: e.target.checked ? new Date().toISOString().split('T')[0] : '',
                        refundAmount: e.target.checked && formData.refundAmount === 0 ? defaultRefundAmount : formData.refundAmount
                      });
                    }}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-rose-900 dark:text-rose-200">Issue refund for membership dues</span>
                </label>

                {formData.refunded && (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-[#0f172a] rounded-lg p-3 border border-rose-200 dark:border-rose-800">
                      <p className="text-xs text-rose-800 dark:text-rose-200 mb-2">
                        <strong>Cash Accounting:</strong> This will keep the original revenue transaction and create a new OPEX expense transaction for the refund.
                      </p>
                      <p className="text-xs text-rose-700 dark:text-rose-200">
                        <strong>Partial Refund:</strong> Amount less than dues → Member stays <em>Paid</em> (with PR badge)<br/>
                        <strong>Full Refund:</strong> Amount equals/exceeds dues → Member marked as <em>Refunded</em>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rose-900 dark:text-rose-200 mb-2">Refund Amount *</label>
                      <CurrencyInput
                        value={formData.refundAmount}
                        onChange={(value) => setFormData({ ...formData, refundAmount: value })}
                        className="w-full pr-4 py-3 border border-rose-300 dark:border-rose-800 dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-lg font-semibold"
                        placeholder="0.00"
                        required
                        showIcon={true}
                      />
                      <p className="text-xs text-rose-700 dark:text-rose-200 mt-1">
                        Original dues amount: {formatCurrency(formData.dues?.totalRealized || calculatedDues.totalRealized)}
                        {formData.refundAmount > 0 && formData.refundAmount < (formData.dues?.totalRealized || calculatedDues.totalRealized) && (
                          <span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-300">→ PARTIAL REFUND (Member stays Paid)</span>
                        )}
                        {formData.refundAmount >= (formData.dues?.totalRealized || calculatedDues.totalRealized) && formData.refundAmount > 0 && (
                          <span className="ml-2 font-semibold text-amber-700 dark:text-amber-300">→ FULL REFUND (Member marked Refunded)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rose-900 dark:text-rose-200 mb-2">Refund Date *</label>
                      <input
                        type="date"
                        value={formData.refundDate}
                        onChange={(e) => setFormData({ ...formData, refundDate: e.target.value })}
                        className="w-full px-4 py-3 border border-rose-300 dark:border-rose-800 dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rose-900 dark:text-rose-200 mb-2">Refund Reason *</label>
                      <textarea
                        value={formData.refundReason}
                        onChange={(e) => setFormData({ ...formData, refundReason: e.target.value })}
                        className="w-full px-4 py-3 border border-rose-300 dark:border-rose-800 dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        rows="2"
                        placeholder="e.g., Member relocated, Medical hardship, etc."
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show refund info if already refunded (from previous save) */}
            {isEditing && member && member.refunded && (
              <div className="bg-rose-100 dark:bg-rose-900/40 rounded-xl p-4 border-2 border-rose-300 dark:border-rose-700/50">
                <h3 className="font-semibold text-rose-900 dark:text-rose-200 text-sm uppercase tracking-wide mb-2">Refund Previously Issued</h3>
                <div className="text-sm text-rose-800 dark:text-rose-200 space-y-1">
                  <p><strong>Refund Date:</strong> {formatDate(member.refundDate)}</p>
                  <p><strong>Refund Amount:</strong> {formatCurrency(member.refundAmount || member.dues?.totalRealized || member.totalRealized || 0)}</p>
                  <p><strong>Refund Reason:</strong> {member.refundReason}</p>
                  <p className="text-xs mt-1"><em>Original dues: {formatCurrency(member.dues?.totalRealized || member.totalRealized || 0)}</em></p>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-200 mt-2 italic">This member has already been refunded. Revenue and OPEX expense transactions are in the system.</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                {isEditing ? 'Update Member' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Members({ data, onRefresh, fiscalYear }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResidence, setFilterResidence] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Ensure all members have residence field (migration for old data) - memoized
  const membersWithResidence = useMemo(() => {
    return data.members.map(m => ({
      ...m,
      residence: m.residence || RESIDENCE_TYPE.INSIDE,
      dues: m.dues || {
        baseDues: DUES_STRUCTURE.BASE_DUES,
        additionalFees: [],
        discounts: [],
        customDiscounts: [],
        totalRealized: m.totalRealized || 675.00,
        totalValue: m.totalRealized || 675.00,
        totalFees: 0,
        totalDiscounts: 0
      }
    }));
  }, [data.members]);

  const filteredMembers = useMemo(() => {
    return membersWithResidence.filter(m => {
      const matchesSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Determine refund status for filtering
      const memberDues = m.dues?.totalRealized || m.totalRealized || 0;
      const isFullRefund = m.refunded && m.refundAmount >= memberDues;
      const isPartialRefund = m.refunded && m.refundAmount < memberDues;

      const matchesStatusFilter = filterStatus === 'all' ||
                           (filterStatus === 'paid' && (m.datePaid && !m.refunded || isPartialRefund)) ||
                           (filterStatus === 'unpaid' && !m.datePaid && !m.refunded) ||
                           (filterStatus === 'refunded' && isFullRefund);
      const matchesResidenceFilter = filterResidence === 'all' ||
                           (filterResidence === 'inside' && m.residence === RESIDENCE_TYPE.INSIDE) ||
                           (filterResidence === 'outside' && m.residence === RESIDENCE_TYPE.OUTSIDE);
      return matchesSearch && matchesStatusFilter && matchesResidenceFilter;
    });
  }, [membersWithResidence, searchQuery, filterStatus, filterResidence]);

  // Memoize metrics calculation to avoid recalculating on every render
  const memberMetrics = useMemo(() => {
    return calculateMemberMetrics(membersWithResidence);
  }, [membersWithResidence]);

  const compliance = memberMetrics.compliance;

  // Calculate stats in a single pass for better performance - memoized
  const stats = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let refunded = 0;
    let totalRevenue = 0;

    // Single pass through members instead of 4 separate filter operations
    membersWithResidence.forEach(m => {
      const memberDues = m.dues?.totalRealized || m.totalRealized || 0;
      totalRevenue += memberDues;

      if (!m.datePaid && !m.refunded) {
        unpaid++;
      } else if (m.refunded) {
        const isFullRefund = m.refundAmount >= memberDues;
        if (isFullRefund) {
          refunded++;
        } else {
          paid++; // Partial refund counts as paid
        }
      } else if (m.datePaid) {
        paid++;
      }
    });

    return {
      total: membersWithResidence.length,
      paid,
      unpaid,
      refunded,
      totalRevenue,
      inside: compliance.count.inside,
      outside: compliance.count.outside,
      outsidePercentage: (compliance.percentage * 100).toFixed(1),
      compliant: compliance.compliant
    };
  }, [membersWithResidence, compliance]);

  const handleSaveMember = async (member) => {
    const isEditing = !!editingMember;
    const previouslyPaid = isEditing ? editingMember.datePaid : null;
    const previouslyRefunded = isEditing ? editingMember.refunded : false;

    // Determine if this is a full or partial refund
    const memberDuesAmount = member.dues?.totalRealized || member.totalRealized || 0;
    const isFullRefund = member.refunded && member.refundAmount >= memberDuesAmount;
    const isPartialRefund = member.refunded && member.refundAmount < memberDuesAmount;

    console.log('🔍 Refund Analysis:', {
      refunded: member.refunded,
      refundAmount: member.refundAmount,
      duesAmount: memberDuesAmount,
      isFullRefund,
      isPartialRefund
    });

    // Save member with fiscal year
    await storage.saveMember(member, fiscalYear);
    console.log(`✅ Member ${isEditing ? 'updated' : 'added'} for FY${fiscalYear}:`, member.name);

    // Handle REFUND - Process before other transaction logic
    if (member.refunded && !previouslyRefunded && isEditing) {
      console.log(`💸 Processing ${isFullRefund ? 'FULL' : 'PARTIAL'} refund for member:`, member.name);

      // Find existing revenue transaction (DO NOT DELETE IT!)
      const transactions = await storage.getTransactions(fiscalYear);
      const revenueTransaction = transactions.find(t => t.memberId === member.id && t.type === 'revenue');

      if (revenueTransaction) {
        console.log('✅ Found original revenue transaction - keeping it for cash accounting');

        // Create NEW expense transaction for the refund
        const refundType = isFullRefund ? 'FULL REFUND' : 'PARTIAL REFUND';
        const refundTransaction = {
          id: `txn_refund_${Date.now()}`,
          type: 'expense',
          expenseType: 'OPEX',
          category: 'Programs / Membership Expenses Reimbursed',
          subCategory: 'Membership Refund',
          description: `${refundType}: ${member.name} - ${isPartialRefund ? `$${member.refundAmount} of $${memberDuesAmount}` : 'Full Membership Dues'} (${member.refundReason})`,
          amount: Math.abs(member.refundAmount || member.totalRealized || member.dues?.totalRealized || revenueTransaction.amount),
          date: member.refundDate,
          paymentMethod: member.paymentMethod || revenueTransaction.paymentMethod || 'Check',
          memberId: member.id,
          refundOf: revenueTransaction.id, // Link to original transaction
          fiscalYear: fiscalYear,
          createdAt: new Date().toISOString(),
          createdBy: 'treasurer'
        };

        console.log('💸 Creating refund expense transaction:', refundTransaction);
        await storage.addTransaction(refundTransaction, fiscalYear);
      } else {
        console.warn('⚠️ No revenue transaction found for member refund:', member.name);
      }
    }
    // Handle transaction creation/update (non-refund scenarios)
    // If member just got marked as paid (wasn't paid before, now is paid)
    else if (member.datePaid && !previouslyPaid && !member.refunded) {
      const transaction = {
        id: `txn_${Date.now()}`,
        type: 'revenue',
        category: 'Member Dues',
        subCategory: member.type === 'New Member' ? 'New Member' : 'Returning Member',
        description: `${member.name} - Member Dues`,
        amount: Math.abs(member.totalRealized),
        date: member.datePaid,
        paymentMethod: member.paymentMethod,
        checkNumber: member.checkNumber || null,
        memberId: member.id,
        fiscalYear: fiscalYear,
        createdAt: new Date().toISOString(),
        createdBy: 'treasurer'
      };

      console.log('💰 Creating member payment transaction:', transaction);
      await storage.addTransaction(transaction, fiscalYear);
    }
    // If member was already paid and payment details changed, update the transaction
    else if (member.datePaid && previouslyPaid && isEditing && !member.refunded) {
      // Find existing transaction for this member
      const transactions = await storage.getTransactions(fiscalYear);
      const existingTransaction = transactions.find(t => t.memberId === member.id && t.type === 'revenue');

      if (existingTransaction) {
        const updatedTransaction = {
          ...existingTransaction,
          description: `${member.name} - Member Dues`,
          amount: Math.abs(member.totalRealized),
          date: member.datePaid,
          paymentMethod: member.paymentMethod,
          checkNumber: member.checkNumber || null
        };

        console.log('💰 Updating member payment transaction:', updatedTransaction);
        await storage.updateTransaction(existingTransaction.id, updatedTransaction, fiscalYear);
      }
    }
    // If member was unpaid (transaction removed) - ONLY delete if NOT a refund
    else if (!member.datePaid && previouslyPaid && isEditing && !member.refunded) {
      const transactions = await storage.getTransactions(fiscalYear);
      const existingTransaction = transactions.find(t => t.memberId === member.id && t.type === 'revenue');

      if (existingTransaction) {
        console.log('🗑️ Deleting member payment transaction:', existingTransaction.id);
        await storage.deleteTransaction(existingTransaction.id, fiscalYear);
      }
    }

    setShowAddModal(false);
    setEditingMember(null);
    onRefresh();
  };

  const handleDeleteMember = async (member) => {
    const confirmMessage = `Are you sure you want to delete ${member.name}?\n\nThis will also delete any associated payment transactions.`;

    if (window.confirm(confirmMessage)) {
      // Delete any associated transaction
      if (member.datePaid) {
        const transactions = await storage.getTransactions(fiscalYear);
        const memberTransaction = transactions.find(t => t.memberId === member.id);

        if (memberTransaction) {
          console.log('🗑️ Deleting member payment transaction:', memberTransaction.id);
          await storage.deleteTransaction(memberTransaction.id, fiscalYear);
        }
      }

      // Delete the member
      console.log(`🗑️ Deleting member from FY${fiscalYear}:`, member.name);
      await storage.deleteMember(member.id, fiscalYear);

      onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Members</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#f8fafc]">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{stats.paid}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Unpaid</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-300">{stats.unpaid}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Refunded</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">{stats.refunded}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Inside / Outside</p>
          <p className="text-xl font-bold">
            <span className="text-emerald-600 dark:text-emerald-300">{stats.inside}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-blue-600 dark:text-blue-300">{stats.outside}</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.outsidePercentage}% outside
            {!stats.compliant && <span className="text-rose-600 dark:text-rose-300"> ⚠️</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'paid', 'unpaid', 'refunded'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? (status === 'refunded' ? 'bg-amber-600 dark:bg-amber-700 text-white' : 'bg-blue-600 dark:bg-blue-700 text-white')
                    : 'bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-2 pl-2 border-l border-slate-300 dark:border-[#334155]">
            {[
              { value: 'all', label: 'All' },
              { value: 'inside', label: 'Inside Only' },
              { value: 'outside', label: 'Outside Only' }
            ].map(residence => (
              <button
                key={residence.value}
                onClick={() => setFilterResidence(residence.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterResidence === residence.value
                    ? 'bg-emerald-600 dark:bg-emerald-700 text-white'
                    : 'bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155]'
                }`}
              >
                {residence.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Member Button - Positioned left of transaction button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-24 w-14 h-14 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 group"
        title="Add New Member"
      >
        <Plus className="w-6 h-6" />
        <span className="absolute right-full mr-3 px-3 py-1 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Add Member
        </span>
      </button>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-transparent border-b border-slate-200 dark:border-[#334155]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Member Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Date Paid</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#334155]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="font-medium">No members found</p>
                    <p className="text-sm mt-1">Click "Add Member" to add your first member</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map(m => {
                  // Determine refund status
                  const memberDues = m.dues?.totalRealized || m.totalRealized || 0;
                  const isFullRefund = m.refunded && m.refundAmount >= memberDues;
                  const isPartialRefund = m.refunded && m.refundAmount < memberDues;

                  return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors">
                    <td className="px-6 py-4">
                      {isFullRefund ? (
                        <div className="flex items-center gap-1" title={`Full Refund: $${m.refundAmount} - ${m.refundReason}`}>
                          <RefreshCcw className="w-5 h-5 text-amber-500 dark:text-amber-300" />
                        </div>
                      ) : isPartialRefund ? (
                        <div className="flex items-center gap-1" title={`Paid (Partial Refund: $${m.refundAmount} of $${memberDues}) - ${m.refundReason}`}>
                          <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-300" />
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200 px-1.5 py-0.5 rounded font-medium">PR</span>
                        </div>
                      ) : m.datePaid ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-300" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-[#f8fafc]">{m.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        m.residence === RESIDENCE_TYPE.INSIDE
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
                      }`}>
                        <Home className="w-3 h-3" />
                        {m.residence}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{m.type || m.newReturn || 'Return'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(m.datePaid)}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900 dark:text-[#f8fafc]">
                      {formatCurrency(m.dues?.totalRealized || m.totalRealized || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingMember(m);
                            setShowAddModal(true);
                          }}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                          title="Edit member"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m)}
                          className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded transition-colors"
                          title="Delete member"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddMemberModal
          onClose={() => {
            setShowAddModal(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
          existingMembers={membersWithResidence}
          member={editingMember}
          fiscalYear={fiscalYear}
        />
      )}
    </div>
  );
}

export default Members;
