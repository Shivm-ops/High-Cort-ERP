"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Scale, Zap, IndianRupee, PieChart, FileDiff, ArrowLeft, X, ExternalLink } from "lucide-react";
import Header from "@/components/layout/Header";

// ─────────────────────────────────────────────────────
// GLOBAL CONSTANTS
// ─────────────────────────────────────────────────────
const INDIA_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// ─────────────────────────────────────────────────────
// LIMITATION CALCULATOR
// ─────────────────────────────────────────────────────
function LimitationCalculator() {
  const causes = [
    { label: "Consumer Case (CDRC)", days: 730 },
    { label: "NI Act S.138 (Cheque Bounce)", days: 30 },
    { label: "MACT Claim (Motor Accident)", days: 730 },
    { label: "Civil Suit (Money Recovery)", days: 1095 },
    { label: "Civil Appeal (HC)", days: 90 },
    { label: "Civil Appeal (SC)", days: 90 },
    { label: "Criminal Appeal (Sessions)", days: 30 },
    { label: "Criminal Appeal (HC)", days: 60 },
    { label: "Writ Petition (HC)", days: 730 },
    { label: "Writ Petition (SC)", days: 730 },
    { label: "Family Matter – Divorce", days: 1095 },
    { label: "SARFAESI Application", days: 45 },
    { label: "Arbitration Claim", days: 1095 },
    { label: "Service Matter (CAT/HC)", days: 365 },
    { label: "Execution of Decree", days: 1095 },
  ];
  const [cause, setCause] = useState(causes[0].label);
  const [incidentDate, setIncidentDate] = useState("");
  const [result, setResult] = useState<{deadline: string; daysLeft: number; risk: string} | null>(null);

  const calculate = () => {
    if (!incidentDate) return;
    const selected = causes.find(c => c.label === cause)!;
    const start = new Date(incidentDate);
    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + selected.days);
    const today = new Date();
    const daysLeft = Math.floor((deadline.getTime() - today.getTime()) / 86400000);
    const risk = daysLeft < 0 ? "Expired" : daysLeft <= 30 ? "Critical" : daysLeft <= 90 ? "Warning" : "Safe";
    setResult({ deadline: deadline.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }), daysLeft, risk });
  };

  const riskColor = result?.risk === "Expired" ? "text-red-600 bg-red-50 border-red-200" :
    result?.risk === "Critical" ? "text-orange-600 bg-orange-50 border-orange-200" :
    result?.risk === "Warning" ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
    "text-green-600 bg-green-50 border-green-200";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cause of Action / Matter Type</label>
        <select value={cause} onChange={e => setCause(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
          {causes.map(c => <option key={c.label}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Cause of Action / Incident</label>
        <input type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
      </div>
      <button onClick={calculate} className="w-full py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors">Calculate Limitation</button>
      {result && (
        <div className={`p-4 rounded-xl border ${riskColor}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Filing Deadline</p>
              <p className="text-2xl font-bold">{result.deadline}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider">{result.risk}</span>
              <p className="text-xl font-bold">{result.daysLeft < 0 ? `${Math.abs(result.daysLeft)} days overdue` : `${result.daysLeft} days left`}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MACT COMPENSATION CALCULATOR
// ─────────────────────────────────────────────────────
function MACTCalculator() {
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [nature, setNature] = useState("death");
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const a = parseInt(age);
    const y = parseFloat(income) * 12;
    if (!a || !y) return;
    const multiplier = a <= 15 ? 20 : a <= 25 ? 18 : a <= 35 ? 17 : a <= 45 ? 16 : a <= 55 ? 15 : a <= 65 ? 13 : 11;
    const dependent_add = 0.5; // 1/3 personal expenses deducted = 2/3 remains but SC calculates ~50% for dependants
    if (nature === "death") {
      const loss_of_dependency = Math.round(y * dependent_add * multiplier);
      const funeral = 15000;
      const consortium = 40000;
      const loss_estate = 15000;
      const total = loss_of_dependency + funeral + consortium + loss_estate;
      setResult({ loss_of_dependency, funeral, consortium, loss_estate, total, multiplier });
    } else {
      // Disability — simplified
      const loss_earnings = Math.round(y * multiplier * 0.4);
      const pain_suffering = 200000;
      const medical = 100000;
      const total = loss_earnings + pain_suffering + medical;
      setResult({ loss_earnings, pain_suffering, medical, total, multiplier });
    }
  };

  const fmt = (n?: number) => typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "₹0";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Age of Victim</label>
          <input type="number" placeholder="e.g. 35" value={age} onChange={e => setAge(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Monthly Income (₹)</label>
          <input type="number" placeholder="e.g. 25000" value={income} onChange={e => setIncome(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nature of Claim</label>
        <div className="flex gap-3">
          {["death", "disability"].map(n => (
            <button key={n} onClick={() => { setNature(n); setResult(null); }} className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${nature === n ? "bg-sky-500 text-white border-sky-500" : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"}`}>
              {n === "death" ? "Death Claim" : "Disability Claim"}
            </button>
          ))}
        </div>
      </div>
      <button onClick={calculate} className="w-full py-2.5 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors">Calculate Compensation</button>
      {result && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2">
          {nature === "death" ? (
            <>
              <Row label="Loss of Dependency" value={fmt(result.loss_of_dependency)} />
              <Row label="Funeral Expenses" value={fmt(result.funeral)} />
              <Row label="Loss of Consortium" value={fmt(result.consortium)} />
              <Row label="Loss of Estate" value={fmt(result.loss_estate)} />
              <div className="text-xs text-sky-600 mt-1">Multiplier used: {result.multiplier} (Sarla Verma formula)</div>
            </>
          ) : (
            <>
              <Row label="Loss of Future Earnings" value={fmt(result.loss_earnings)} />
              <Row label="Pain & Suffering" value={fmt(result.pain_suffering)} />
              <Row label="Medical Expenses (est.)" value={fmt(result.medical)} />
            </>
          )}
          <div className="pt-2 border-t border-sky-200 flex justify-between items-center">
            <span className="text-sm font-bold text-sky-800">Total Compensation</span>
            <span className="text-xl font-bold text-sky-700">{fmt(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// INTEREST CALCULATOR
// ─────────────────────────────────────────────────────
function InterestCalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("simple");
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    if (!p || !r || !from || !to) return;
    const days = (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
    const years = days / 365;
    let interest = 0;
    if (type === "simple") interest = Math.round((p * r * years) / 100);
    else interest = Math.round(p * Math.pow(1 + r / 100, years) - p);
    setResult({ interest, total: Math.round(p + interest), days: Math.round(days), years: years.toFixed(2) });
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Principal Amount (₹)</label>
          <input type="number" placeholder="e.g. 500000" value={principal} onChange={e => setPrincipal(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Interest Rate (% per annum)</label>
          <input type="number" placeholder="e.g. 9" value={rate} onChange={e => setRate(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Interest Type</label>
        <div className="flex gap-3">
          {[["simple", "Simple Interest"], ["compound", "Compound Interest"]].map(([v, l]) => (
            <button key={v} onClick={() => setType(v)} className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${type === v ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"}`}>{l}</button>
          ))}
        </div>
      </div>
      <button onClick={calculate} className="w-full py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors">Calculate Interest</button>
      {result && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <Row label="Period" value={`${result.days} days (${result.years} years)`} />
          <Row label="Interest Amount" value={fmt(result.interest)} />
          <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
            <span className="text-sm font-bold text-amber-800">Total Amount Due</span>
            <span className="text-xl font-bold text-amber-700">{fmt(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// COURT FEES CALCULATOR
// ─────────────────────────────────────────────────────
function CourtFeesCalculator() {
  const [suitValue, setSuitValue] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const v = parseFloat(suitValue);
    if (!v) return;
    // Ad valorem court fees — Maharashtra schedule
    let fee = 0;
    if (v <= 5000) fee = 50;
    else if (v <= 10000) fee = Math.round(v * 0.02);
    else if (v <= 100000) fee = Math.round(200 + (v - 10000) * 0.025);
    else if (v <= 500000) fee = Math.round(2450 + (v - 100000) * 0.03);
    else if (v <= 2000000) fee = Math.round(14450 + (v - 500000) * 0.04);
    else fee = Math.round(74450 + (v - 2000000) * 0.05);
    setResult(Math.min(fee, 250000)); // cap at 2.5L for most states
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">State / Jurisdiction</label>
        <select value={state} onChange={e => setState(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
          {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Suit Value / Claim Amount (₹)</label>
        <input type="number" placeholder="e.g. 500000" value={suitValue} onChange={e => setSuitValue(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
      </div>
      <button onClick={calculate} className="w-full py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors">Calculate Court Fees</button>
      {result !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Row label="Suit Value" value={`₹${parseFloat(suitValue).toLocaleString("en-IN")}`} />
          <Row label="State" value={state} />
          <div className="pt-2 mt-2 border-t border-blue-200 flex justify-between items-center">
            <span className="text-sm font-bold text-blue-800">Court Fees Payable</span>
            <span className="text-2xl font-bold text-blue-700">₹{result.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-xs text-blue-500 mt-2">* Approximate. Verify with current court fee schedule of {state}.</p>
          <a
            href="https://pay.ecourts.gov.in/epay/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white text-blue-600 border border-blue-200 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm"
          >
            Pay Court Fees Online (ePay) <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// STAMP DUTY ESTIMATOR
// ─────────────────────────────────────────────────────
function StampDutyEstimator() {
  const [propValue, setPropValue] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [gender, setGender] = useState("male");
  const [result, setResult] = useState<any>(null);

  const rates: Record<string, { sd: number; reg: number }> = {
    "Andaman and Nicobar Islands": { sd: 5, reg: 1 },
    "Andhra Pradesh": { sd: 5, reg: 1 },
    "Arunachal Pradesh": { sd: 6, reg: 1 },
    "Assam": { sd: 6, reg: 1 },
    "Bihar": { sd: 6, reg: 2 },
    "Chandigarh": { sd: 5, reg: 1 },
    "Chhattisgarh": { sd: 5, reg: 1 },
    "Dadra and Nagar Haveli and Daman and Diu": { sd: 5, reg: 1 },
    "Delhi": { sd: 6, reg: 1 },
    "Goa": { sd: 5, reg: 1 },
    "Gujarat": { sd: 4.9, reg: 1 },
    "Haryana": { sd: 7, reg: 1 },
    "Himachal Pradesh": { sd: 5, reg: 1 },
    "Jammu and Kashmir": { sd: 5, reg: 1 },
    "Jharkhand": { sd: 4, reg: 1 },
    "Karnataka": { sd: 5.6, reg: 1 },
    "Kerala": { sd: 8, reg: 2 },
    "Ladakh": { sd: 5, reg: 1 },
    "Lakshadweep": { sd: 5, reg: 1 },
    "Madhya Pradesh": { sd: 7.5, reg: 3 },
    "Maharashtra": { sd: 6, reg: 1 },
    "Manipur": { sd: 7, reg: 1 },
    "Meghalaya": { sd: 6, reg: 1 },
    "Mizoram": { sd: 9, reg: 1 },
    "Nagaland": { sd: 8.25, reg: 1 },
    "Odisha": { sd: 5, reg: 1 },
    "Puducherry": { sd: 5, reg: 1 },
    "Punjab": { sd: 7, reg: 1 },
    "Rajasthan": { sd: 6, reg: 1 },
    "Sikkim": { sd: 4, reg: 1 },
    "Tamil Nadu": { sd: 7, reg: 4 },
    "Telangana": { sd: 5.5, reg: 0.5 },
    "Tripura": { sd: 5, reg: 1 },
    "Uttar Pradesh": { sd: 7, reg: 1 },
    "Uttarakhand": { sd: 5, reg: 1 },
    "West Bengal": { sd: 6, reg: 1 },
  };

  const calculate = () => {
    const v = parseFloat(propValue);
    if (!v) return;
    const r = rates[state] || { sd: 5, reg: 1 };
    const sdRate = gender === "female" && state === "Delhi" ? 4 : r.sd;
    const stamp = Math.round(v * sdRate / 100);
    const reg = Math.round(v * r.reg / 100);
    setResult({ stamp, reg, total: stamp + reg, rate: sdRate });
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">State</label>
          <select value={state} onChange={e => setState(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400">
            {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Buyer Gender</label>
          <div className="flex gap-2">
            {[["male", "Male"], ["female", "Female"]].map(([v, l]) => (
              <button key={v} onClick={() => setGender(v)} className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${gender === v ? "bg-pink-500 text-white border-pink-500" : "bg-white text-gray-600 border-gray-200"}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Property Market Value (₹)</label>
        <input type="number" placeholder="e.g. 5000000" value={propValue} onChange={e => setPropValue(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400" />
      </div>
      <button onClick={calculate} className="w-full py-2.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors">Estimate Stamp Duty</button>
      {result && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 space-y-2">
          <Row label={`Stamp Duty (@ ${result.rate}%)`} value={fmt(result.stamp)} />
          <Row label="Registration Fee (@ 1%)" value={fmt(result.reg)} />
          <div className="pt-2 border-t border-pink-200 flex justify-between items-center">
            <span className="text-sm font-bold text-pink-800">Total Payable</span>
            <span className="text-2xl font-bold text-pink-700">{fmt(result.total)}</span>
          </div>
          <p className="text-xs text-pink-400 mt-1">* Approximate. Actual rates may vary by circle rate and local amendments.</p>
          <a
            href={state === "Maharashtra" ? "https://igrmaharashtra.gov.in/Home" : "https://www.shcilestamp.com/"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white text-pink-600 border border-pink-200 font-semibold rounded-xl hover:bg-pink-50 transition-colors text-sm"
          >
            {state === "Maharashtra" ? "Pay via IGR Maharashtra (GRAS)" : "Pay Stamp Duty Online (e-Stamping)"} <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// GST PENALTY CALCULATOR
// ─────────────────────────────────────────────────────
function GSTCalculator() {
  const [tax, setTax] = useState("");
  const [cashBalance, setCashBalance] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const t = parseFloat(tax);
    const cb = parseFloat(cashBalance) || 0;
    if (!t || !dueDate || !payDate) return;
    const days = Math.max(0, Math.floor((new Date(payDate).getTime() - new Date(dueDate).getTime()) / 86400000));
    const netTaxLiability = Math.max(0, t - cb);
    const interest = Math.round((netTaxLiability * 18 * days) / (100 * 365));
    // Standard late fee for GSTR-3B with tax liability is ₹50 per day (₹25 CGST + ₹25 SGST)
    // Capped at a maximum depending on turnover, but for a simple calculator we show the per-day amount.
    const maxLateFee = 5000; // Common cap for standard taxpayers
    const lateFee = days > 0 ? Math.min(days * 50, maxLateFee) : 0;
    setResult({ days, interest, lateFee, total: t + interest + lateFee });
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Net Tax Liability (₹)</label>
          <input type="number" placeholder="e.g. 50000" value={tax} onChange={e => setTax(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5" title="Minimum Cash Balance in Electronic Cash Ledger">Min ECL Balance (₹) (Optional)</label>
          <input type="number" placeholder="e.g. 10000" value={cashBalance} onChange={e => setCashBalance(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Payment</label>
          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-2.5 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors">Calculate Late Fee & Interest</button>
      {result && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-2">
          <Row label="Delay" value={`${result.days} days`} />
          <Row label="Interest @ 18% p.a." value={fmt(result.interest)} />
          <Row label="Late Fee (@ ₹50/day, max ₹5,000)" value={fmt(result.lateFee)} />
          <div className="pt-2 border-t border-violet-200 flex justify-between items-center">
            <span className="text-sm font-bold text-violet-800">Total Liability</span>
            <span className="text-2xl font-bold text-violet-700">{fmt(result.total)}</span>
          </div>
          <p className="text-[10px] text-violet-500 mt-2">* Does not include Section 73/74 penalties which only apply if a Show Cause Notice is issued by the department.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
const TOOLS = [
  { id: "limitation", label: "Limitation Calculator", desc: "Calculate precise filing deadlines based on cause of action", icon: Calculator, color: "#10B981", tag: "Limitation", component: LimitationCalculator },
  { id: "mact", label: "MACT Compensation", desc: "Compute motor accident claims using Sarla Verma formula", icon: Scale, color: "#0EA5E9", tag: "Motor Vehicles", component: MACTCalculator },
  { id: "interest", label: "Interest Calculator", desc: "Calculate pendente lite, future, simple & compound interest", icon: Zap, color: "#F59E0B", tag: "Finance", component: InterestCalculator },
  { id: "gst", label: "GST Penalty Calc", desc: "Late fee & interest calculation for GST tax default", icon: IndianRupee, color: "#8B5CF6", tag: "Taxation", component: GSTCalculator },
  { id: "courtfees", label: "Court Fees Calculator", desc: "Compute ad-valorem court fees for civil suits by state", icon: PieChart, color: "#3B82F6", tag: "Civil", component: CourtFeesCalculator },
  { id: "stampduty", label: "Stamp Duty Estimator", desc: "Calculate registration and stamp duty for conveyances", icon: FileDiff, color: "#EC4899", tag: "Property", component: StampDutyEstimator },
];

export default function ToolsPage() {
  const [active, setActive] = useState<string | null>(null);
  const tool = TOOLS.find(t => t.id === active);

  // JSX requires capitalized component names — cannot use tool!.icon directly
  const ToolIcon = tool?.icon;
  const ToolComponent = tool?.component;

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Tools & Calculators" subtitle="Legal utility calculators and reference tools" />
      <div className="p-6">
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TOOLS.map((t, i) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActive(t.id)}
                    className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col text-left hover:border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${t.color}1A` }}>
                        <t.icon className="w-6 h-6" style={{ color: t.color }} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md text-gray-500 bg-gray-50 border border-gray-100">{t.tag}</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2 group-hover:text-sidebar transition-colors">{t.label}</h3>
                    <p className="text-[13px] text-gray-500 flex-1">{t.desc}</p>
                    <div className="mt-4 text-xs font-semibold flex items-center gap-1" style={{ color: t.color }}>
                      Open Calculator →
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="calc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button onClick={() => setActive(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Calculators
              </button>
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-5 border-b border-gray-100" style={{ background: `${tool?.color}08` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tool?.color}20` }}>
                      {ToolIcon && <ToolIcon className="w-5 h-5" style={{ color: tool?.color }} />}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">{tool?.label}</h2>
                      <p className="text-xs text-gray-500">{tool?.desc}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    {ToolComponent && <ToolComponent />}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
