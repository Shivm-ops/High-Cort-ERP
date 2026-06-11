"use client";

import { useState } from "react";
import { useMactCalculator } from "@/lib/hooks/useMact";
import { Calculator, IndianRupee, Save } from "lucide-react";

export default function MactCalculator() {
  const calcMutation = useMactCalculator();
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    age: 35,
    monthly_income: 15000,
    future_prospects_pct: 40,
    personal_expense_deduction_pct: 33.33,
    multiplier: 16,
    medical_expenses: 50000,
    loss_of_estate: 15000,
    consortium: 40000,
    funeral_expenses: 15000,
    interest_rate_pct: 7.5,
    years_since_filing: 2.0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const calculate = () => {
    calcMutation.mutate(formData, {
      onSuccess: (data) => setResult(data)
    });
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Input Form */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-mint" /> Parameters (Sarla Verma Guidelines)
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age of Deceased/Injured</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (₹)</label>
              <input type="number" name="monthly_income" value={formData.monthly_income} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Future Prospects (%)</label>
              <input type="number" name="future_prospects_pct" value={formData.future_prospects_pct} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Exp. Deduction (%)</label>
              <input type="number" name="personal_expense_deduction_pct" value={formData.personal_expense_deduction_pct} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier (Based on Age)</label>
              <input type="number" name="multiplier" value={formData.multiplier} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Conventional Heads (₹)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Expenses</label>
              <input type="number" name="medical_expenses" value={formData.medical_expenses} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loss of Estate</label>
              <input type="number" name="loss_of_estate" value={formData.loss_of_estate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loss of Consortium</label>
              <input type="number" name="consortium" value={formData.consortium} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funeral Expenses</label>
              <input type="number" name="funeral_expenses" value={formData.funeral_expenses} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
              <input type="number" name="interest_rate_pct" value={formData.interest_rate_pct} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years Since Filing</label>
              <input type="number" name="years_since_filing" value={formData.years_since_filing} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20" />
            </div>
          </div>
        </div>

        <button 
          onClick={calculate}
          disabled={calcMutation.isPending}
          className="w-full bg-sidebar text-white py-3 rounded-xl font-bold hover:bg-sidebar-dark transition-colors flex justify-center items-center gap-2"
        >
          <Calculator className="w-5 h-5" /> Calculate Compensation
        </button>
      </div>

      {/* Output Panel */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col">
        <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-gray-600" /> Calculation Summary
        </h3>

        {result ? (
          <div className="flex-1 flex flex-col">
            <div className="space-y-4 text-sm flex-1">
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Monthly Dependency (After Deductions)</span>
                <span className="font-semibold text-gray-900">₹{result.monthly_dependency.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Annual Dependency</span>
                <span className="font-semibold text-gray-900">₹{result.annual_dependency.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Total Loss of Dependency (Annual × {formData.multiplier})</span>
                <span className="font-semibold text-gray-900 text-base">₹{result.loss_of_dependency.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="pt-2 pb-3 border-b border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>+ Medical Expenses</span>
                  <span>₹{formData.medical_expenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>+ Loss of Estate</span>
                  <span>₹{formData.loss_of_estate.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>+ Consortium</span>
                  <span>₹{formData.consortium.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>+ Funeral Expenses</span>
                  <span>₹{formData.funeral_expenses.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-mint p-5 rounded-xl mt-6 text-center">
              <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Base Compensation Award</span>
              <span className="block text-3xl font-black text-gray-900">₹{result.total_compensation.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="bg-mint/5 border-2 border-mint p-5 rounded-xl mt-4 text-center">
              <span className="block text-sm font-semibold text-mint uppercase tracking-wide mb-1">
                Final Award (Including ₹{result.interest_amount.toLocaleString('en-IN')} Interest)
              </span>
              <span className="block text-3xl font-black text-mint">₹{result.final_award.toLocaleString('en-IN')}</span>
            </div>
            
            <button className="mt-4 flex items-center justify-center gap-2 text-mint font-semibold hover:underline">
              <Save className="w-4 h-4" /> Save Calculation to Case
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Calculator className="w-16 h-16 mb-4 opacity-20" />
            <p>Enter parameters and click Calculate to view the statutory compensation award.</p>
          </div>
        )}
      </div>
    </div>
  );
}
