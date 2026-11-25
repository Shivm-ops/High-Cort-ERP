"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Scale,
  Zap,
  IndianRupee,
  PieChart,
  FileDiff,
  ArrowLeft,
  ExternalLink,
  Copy,
  CheckCircle2,
  BookmarkPlus,
} from "lucide-react";
import Header from "@/components/layout/Header";
import {
  LIMITATION_RULES,
  computeStatutoryDeadline,
} from "@/lib/constants/limitations";
import { useCases } from "@/lib/hooks/useCases";
import { useSetCaseLimitation } from "@/lib/hooks/useLimitations";
import { toast } from "sonner";

const INDIA_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

function copyCalculationSummary(summaryText: string) {
  navigator.clipboard.writeText(summaryText);
  toast.success("Calculation summary copied to clipboard");
}

function CopySummaryButton({ summary }: { summary: string }) {
  return (
    <button
      type="button"
      onClick={() => copyCalculationSummary(summary)}
      className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white/90 hover:bg-white border border-gray-200 text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
    >
      <Copy className="w-3.5 h-3.5" />
      Copy Calculation Summary
    </button>
  );
}

// ─────────────────────────────────────────────────────
// 1. STATUTORY LIMITATION CALCULATOR (WITH CASE LINKING)
// ─────────────────────────────────────────────────────
function LimitationCalculator() {
  const [ruleId, setRuleId] = useState(LIMITATION_RULES[0].id);
  const [incidentDate, setIncidentDate] = useState("");
  const [targetCaseId, setTargetCaseId] = useState("");
  const { data: casesData } = useCases({ limit: 200 });
  const setCaseLimitation = useSetCaseLimitation();

  const selectedRule =
    LIMITATION_RULES.find((r) => r.id === ruleId) || LIMITATION_RULES[0];
  const result = incidentDate
    ? computeStatutoryDeadline(incidentDate, selectedRule)
    : null;

  const riskColor =
    result?.risk === "Expired"
      ? "text-red-700 bg-red-50 border-red-200"
      : result?.risk === "Critical"
      ? "text-orange-700 bg-orange-50 border-orange-200"
      : result?.risk === "Warning"
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-emerald-700 bg-emerald-50 border-emerald-200";

  const handleSaveToCase = async () => {
    if (!targetCaseId || !result) {
      toast.error("Select a case first");
      return;
    }
    await setCaseLimitation.mutateAsync({
      case_id: targetCaseId,
      limitation_date: result.deadlineIso,
      incident_date: incidentDate || null,
      limitation_act: selectedRule.act,
      limitation_section: selectedRule.section,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Cause of Action / Matter Type
        </label>
        <select
          value={ruleId}
          onChange={(e) => setRuleId(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
        >
          {LIMITATION_RULES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} — {r.amount} {r.unit}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-gray-500 mt-1">
          Statute: <strong className="text-gray-700">{selectedRule.act}</strong>{" "}
          ({selectedRule.section})
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Date of Cause of Action / Order / Incident
        </label>
        <input
          type="date"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
        />
      </div>

      {selectedRule.note && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3">
          {selectedRule.note}
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-xl border ${riskColor}`}>
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-75">
                {selectedRule.advisoryOnly
                  ? "Advisory Benchmark Date"
                  : "Statutory Filing Deadline"}
              </p>
              <p className="text-2xl font-bold">{result.deadlineFormatted}</p>
              <p className="text-xs mt-1 opacity-80">
                {selectedRule.act} · {selectedRule.section} (
                {selectedRule.amount} {selectedRule.unit})
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider">
                {result.risk}
              </span>
              <p className="text-xl font-bold">
                {result.daysLeft < 0
                  ? `${Math.abs(result.daysLeft)} days overdue`
                  : `${result.daysLeft} days left`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/10 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider opacity-80">
              Save Deadline to a Case (Syncs with Limitation &amp; Deadlines)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={targetCaseId}
                onChange={(e) => setTargetCaseId(e.target.value)}
                className="flex-1 h-9 px-3 bg-white text-gray-800 border border-gray-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="">-- Select Case --</option>
                {(casesData?.cases ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_no ? `${c.case_no} — ` : ""}
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveToCase}
                disabled={!targetCaseId || setCaseLimitation.isPending}
                className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {setCaseLimitation.isPending ? "Saving..." : "Save to Case"}
              </button>
            </div>
          </div>

          <CopySummaryButton
            summary={`Limitation Calculation\nMatter: ${selectedRule.label}\nProvision: ${selectedRule.act} (${selectedRule.section}) — ${selectedRule.amount} ${selectedRule.unit}\nStart Date: ${incidentDate}\nFiling Deadline: ${result.deadlineFormatted} (${result.daysLeft < 0 ? `${Math.abs(result.daysLeft)} days overdue` : `${result.daysLeft} days left`})`}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 2. MACT COMPENSATION CALCULATOR (SARLA VERMA + PRANAY SETHI)
// ─────────────────────────────────────────────────────
function getSarlaVermaMultiplier(age: number): number {
  if (age <= 15) return 20;
  if (age <= 25) return 18;
  if (age <= 30) return 17;
  if (age <= 35) return 16;
  if (age <= 40) return 15;
  if (age <= 45) return 14;
  if (age <= 50) return 13;
  if (age <= 55) return 11;
  if (age <= 60) return 9;
  if (age <= 65) return 7;
  return 5;
}

function getPranaySethiFutureProspectRate(
  age: number,
  employmentType: "salaried" | "self_employed"
): number {
  if (age > 60) return 0;
  if (age >= 50) return employmentType === "salaried" ? 0.15 : 0.1;
  if (age >= 40) return employmentType === "salaried" ? 0.3 : 0.25;
  return employmentType === "salaried" ? 0.5 : 0.4;
}

function MACTCalculator() {
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [nature, setNature] = useState<"death" | "disability">("death");
  const [employmentType, setEmploymentType] = useState<
    "salaried" | "self_employed"
  >("self_employed");
  const [deductionFraction, setDeductionFraction] = useState("0.333333");
  const [consortiumClaimants, setConsortiumClaimants] = useState("1");
  const [disabilityPct, setDisabilityPct] = useState("40");
  const [medicalBills, setMedicalBills] = useState("100000");
  const [painAttendant, setPainAttendant] = useState("100000");
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const a = parseInt(age, 10);
    const monthly = parseFloat(income);
    if (!a || !monthly || a <= 0 || monthly <= 0) {
      toast.error("Enter valid age and monthly income");
      return;
    }
    const annualIncome = monthly * 12;
    const multiplier = getSarlaVermaMultiplier(a);
    const fpRate = getPranaySethiFutureProspectRate(a, employmentType);
    const adjustedAnnual = annualIncome * (1 + fpRate);

    if (nature === "death") {
      const ded = parseFloat(deductionFraction) || 0.333333;
      const netAnnualContribution = adjustedAnnual * (1 - ded);
      const loss_of_dependency = Math.round(netAnnualContribution * multiplier);
      const funeral = 15000;
      const loss_estate = 15000;
      const claimants = Math.max(1, parseInt(consortiumClaimants, 10) || 1);
      const consortium = 40000 * claimants;
      const total = loss_of_dependency + funeral + consortium + loss_estate;
      setResult({
        mode: "death",
        multiplier,
        fpPct: Math.round(fpRate * 100),
        dedLabel:
          ded === 0.5
            ? "1/2 (Bachelor)"
            : ded < 0.22
            ? "1/5 (>6 dependants)"
            : ded < 0.28
            ? "1/4 (4–6 dependants)"
            : "1/3 (2–3 dependants)",
        loss_of_dependency,
        funeral,
        consortium,
        claimants,
        loss_estate,
        total,
      });
    } else {
      const pct = Math.min(100, Math.max(0, parseFloat(disabilityPct) || 0));
      const med = Math.max(0, parseFloat(medicalBills) || 0);
      const pain = Math.max(0, parseFloat(painAttendant) || 0);
      const loss_earnings = Math.round(
        adjustedAnnual * multiplier * (pct / 100)
      );
      const total = loss_earnings + med + pain;
      setResult({
        mode: "disability",
        multiplier,
        fpPct: Math.round(fpRate * 100),
        pct,
        loss_earnings,
        medical: med,
        pain_suffering: pain,
        total,
      });
    }
  };

  const fmt = (n?: number) =>
    typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "₹0";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Age of Victim (Years)
          </label>
          <input
            type="number"
            placeholder="e.g. 35"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Monthly Income (₹)
          </label>
          <input
            type="number"
            placeholder="e.g. 25000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Nature of Claim
          </label>
          <div className="flex gap-2">
            {(["death", "disability"] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setNature(n);
                  setResult(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  nature === n
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
                }`}
              >
                {n === "death" ? "Death Claim" : "Disability Claim"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Employment (Pranay Sethi Future Prospects)
          </label>
          <div className="flex gap-2">
            {[
              { id: "self_employed" as const, label: "Self-Employed" },
              { id: "salaried" as const, label: "Permanent Job" },
            ].map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => setEmploymentType(emp.id)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  employmentType === emp.id
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
                }`}
              >
                {emp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {nature === "death" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Personal Expenses Deduction
            </label>
            <select
              value={deductionFraction}
              onChange={(e) => setDeductionFraction(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none"
            >
              <option value="0.5">Bachelor — Deduct 1/2 (50%)</option>
              <option value="0.333333">
                2–3 Dependants — Deduct 1/3 (33.3%)
              </option>
              <option value="0.25">4–6 Dependants — Deduct 1/4 (25%)</option>
              <option value="0.2">
                &gt; 6 Dependants — Deduct 1/5 (20%)
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Consortium Claimants (₹40,000 each)
            </label>
            <input
              type="number"
              min="1"
              value={consortiumClaimants}
              onChange={(e) => setConsortiumClaimants(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Functional Disability (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={disabilityPct}
              onChange={(e) => setDisabilityPct(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Medical Bills (₹)
            </label>
            <input
              type="number"
              min="0"
              value={medicalBills}
              onChange={(e) => setMedicalBills(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Pain &amp; Attendant (₹)
            </label>
            <input
              type="number"
              min="0"
              value={painAttendant}
              onChange={(e) => setPainAttendant(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={calculate}
        className="w-full py-2.5 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
      >
        Calculate Compensation
      </button>

      {result && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2">
          <div className="text-xs text-sky-700 font-semibold pb-1">
            Sarla Verma Multiplier: {result.multiplier} · Pranay Sethi Future
            Prospects: +{result.fpPct}%
            {result.mode === "death" ? ` · Deduction: ${result.dedLabel}` : ""}
          </div>
          {result.mode === "death" ? (
            <>
              <Row
                label="Loss of Dependency"
                value={fmt(result.loss_of_dependency)}
              />
              <Row label="Funeral Expenses" value={fmt(result.funeral)} />
              <Row
                label={`Loss of Consortium (${result.claimants} claimant${
                  result.claimants > 1 ? "s" : ""
                })`}
                value={fmt(result.consortium)}
              />
              <Row label="Loss of Estate" value={fmt(result.loss_estate)} />
            </>
          ) : (
            <>
              <Row
                label={`Loss of Future Earnings (${result.pct}% disability)`}
                value={fmt(result.loss_earnings)}
              />
              <Row label="Medical Expenses" value={fmt(result.medical)} />
              <Row
                label="Pain, Suffering & Attendant"
                value={fmt(result.pain_suffering)}
              />
            </>
          )}
          <div className="pt-2 border-t border-sky-200 flex justify-between items-center">
            <span className="text-sm font-bold text-sky-800">
              Total Estimated Compensation
            </span>
            <span className="text-xl font-bold text-sky-700">
              {fmt(result.total)}
            </span>
          </div>

          <CopySummaryButton
            summary={
              result.mode === "death"
                ? `MACT Death Compensation Estimate (Sarla Verma / Pranay Sethi)\nAge: ${age} | Monthly Income: ₹${income} | Multiplier: ${result.multiplier} | Future Prospects: +${result.fpPct}% | Deduction: ${result.dedLabel}\nLoss of Dependency: ${fmt(result.loss_of_dependency)}\nFuneral: ${fmt(result.funeral)} | Consortium: ${fmt(result.consortium)} | Estate: ${fmt(result.loss_estate)}\nTotal: ${fmt(result.total)}`
                : `MACT Disability Compensation Estimate\nAge: ${age} | Monthly Income: ₹${income} | Multiplier: ${result.multiplier} | Disability: ${result.pct}%\nLoss of Earning Capacity: ${fmt(result.loss_earnings)}\nMedical: ${fmt(result.medical)} | Pain & Attendant: ${fmt(result.pain_suffering)}\nTotal: ${fmt(result.total)}`
            }
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm gap-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 3. INTEREST CALCULATOR
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
    if (!p || !r || !from || !to) {
      toast.error("Please fill all fields");
      return;
    }
    const days = Math.round(
      (new Date(to).getTime() - new Date(from).getTime()) / 86400000
    );
    if (days < 0) {
      toast.error("To Date must be after From Date");
      return;
    }
    const years = days / 365;
    let interest = 0;
    if (type === "simple") interest = Math.round((p * r * years) / 100);
    else interest = Math.round(p * Math.pow(1 + r / 100, years) - p);
    setResult({
      interest,
      total: Math.round(p + interest),
      days,
      years: years.toFixed(2),
    });
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Principal Amount (₹)
          </label>
          <input
            type="number"
            placeholder="e.g. 500000"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Interest Rate (% per annum)
          </label>
          <input
            type="number"
            placeholder="e.g. 9"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            From Date
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            To Date
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Interest Type
        </label>
        <div className="flex gap-3">
          {[
            ["simple", "Simple Interest"],
            ["compound", "Compound Interest (Annual)"],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                type === v
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={calculate}
        className="w-full py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
      >
        Calculate Interest
      </button>
      {result && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <Row
            label="Period"
            value={`${result.days} days (${result.years} years)`}
          />
          <Row label="Interest Amount" value={fmt(result.interest)} />
          <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
            <span className="text-sm font-bold text-amber-800">
              Total Amount Due
            </span>
            <span className="text-xl font-bold text-amber-700">
              {fmt(result.total)}
            </span>
          </div>
          <CopySummaryButton
            summary={`Interest Calculation (${type === "simple" ? "Simple" : "Compound"})\nPrincipal: ${fmt(parseFloat(principal))}\nRate: ${rate}% p.a. | Period: ${from} to ${to} (${result.days} days / ${result.years} yrs)\nInterest: ${fmt(result.interest)}\nTotal Due: ${fmt(result.total)}`}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 4. COURT FEES CALCULATOR (STATE-SPECIFIC SCHEDULES)
// ─────────────────────────────────────────────────────
function computeStateCourtFee(
  state: string,
  v: number
): { fee: number; scheduleNote: string } {
  switch (state) {
    case "Maharashtra": {
      let fee = 0;
      if (v <= 5000) fee = 200;
      else if (v <= 10000) fee = Math.round(200 + (v - 5000) * 0.04);
      else if (v <= 100000) fee = Math.round(400 + (v - 10000) * 0.06);
      else if (v <= 500000) fee = Math.round(5800 + (v - 100000) * 0.035);
      else if (v <= 1000000) fee = Math.round(19800 + (v - 500000) * 0.025);
      else fee = Math.round(32300 + (v - 1000000) * 0.015);
      return {
        fee: Math.min(fee, 300000),
        scheduleNote: "Maharashtra Court Fees Act (₹3,00,000 statutory ceiling)",
      };
    }
    case "Delhi": {
      let fee = 0;
      if (v <= 400000) fee = Math.round(v * 0.025);
      else fee = Math.round(10000 + (v - 400000) * 0.01);
      return {
        fee: Math.max(100, fee),
        scheduleNote: "Court Fees (Delhi Amendment) Schedule I",
      };
    }
    case "Karnataka": {
      let fee = 0;
      if (v <= 100000) fee = Math.round(v * 0.025);
      else if (v <= 500000) fee = Math.round(2500 + (v - 100000) * 0.05);
      else if (v <= 1000000) fee = Math.round(22500 + (v - 500000) * 0.04);
      else fee = Math.round(42500 + (v - 1000000) * 0.015);
      return {
        fee: Math.max(100, fee),
        scheduleNote: "Karnataka Court Fees & Suits Valuation Act, 1958",
      };
    }
    case "Gujarat": {
      let fee = 0;
      if (v <= 100000) fee = Math.round(v * 0.03);
      else if (v <= 500000) fee = Math.round(3000 + (v - 100000) * 0.025);
      else fee = Math.round(13000 + (v - 500000) * 0.015);
      return {
        fee: Math.min(fee, 75000),
        scheduleNote: "Gujarat Court Fees Act (₹75,000 ceiling)",
      };
    }
    case "Tamil Nadu":
      return {
        fee: Math.max(100, Math.round(v * 0.03)),
        scheduleNote: "Tamil Nadu Court Fees & Suits Valuation Act (3% ad valorem)",
      };
    case "Uttar Pradesh": {
      let fee = 0;
      if (v <= 50000) fee = Math.round(v * 0.075);
      else if (v <= 500000) fee = Math.round(3750 + (v - 50000) * 0.05);
      else fee = Math.round(26250 + (v - 500000) * 0.02);
      return {
        fee: Math.max(100, fee),
        scheduleNote: "UP Court Fees Schedule (Approximate tiered slab)",
      };
    }
    case "West Bengal": {
      let fee = 0;
      if (v <= 100000) fee = Math.round(v * 0.03);
      else fee = Math.round(3000 + (v - 100000) * 0.02);
      return {
        fee: Math.min(fee, 50000),
        scheduleNote: "West Bengal Court Fees Act (₹50,000 cap)",
      };
    }
    default: {
      let fee = 0;
      if (v <= 10000) fee = Math.max(100, Math.round(v * 0.02));
      else if (v <= 100000) fee = Math.round(200 + (v - 10000) * 0.025);
      else if (v <= 500000) fee = Math.round(2450 + (v - 100000) * 0.03);
      else if (v <= 2000000) fee = Math.round(14450 + (v - 500000) * 0.04);
      else fee = Math.round(74450 + (v - 2000000) * 0.05);
      return {
        fee: Math.min(fee, 250000),
        scheduleNote:
          "Model Ad-Valorem Estimate — verify local state Court Fees schedule",
      };
    }
  }
}

function CourtFeesCalculator() {
  const [suitValue, setSuitValue] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [result, setResult] = useState<{
    fee: number;
    scheduleNote: string;
  } | null>(null);

  const calculate = () => {
    const v = parseFloat(suitValue);
    if (!v || v <= 0) {
      toast.error("Enter a valid suit value");
      return;
    }
    setResult(computeStateCourtFee(state, v));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          State / Jurisdiction
        </label>
        <select
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setResult(null);
          }}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        >
          {INDIA_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Suit Value / Claim Amount (₹)
        </label>
        <input
          type="number"
          placeholder="e.g. 500000"
          value={suitValue}
          onChange={(e) => setSuitValue(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        />
      </div>
      <button
        type="button"
        onClick={calculate}
        className="w-full py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
      >
        Calculate Court Fees
      </button>
      {result !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Row
            label="Suit Value"
            value={`₹${parseFloat(suitValue).toLocaleString("en-IN")}`}
          />
          <Row label="State" value={state} />
          <div className="pt-2 mt-2 border-t border-blue-200 flex justify-between items-center">
            <span className="text-sm font-bold text-blue-800">
              Court Fees Payable
            </span>
            <span className="text-2xl font-bold text-blue-700">
              ₹{result.fee.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-2">* {result.scheduleNote}</p>
          <a
            href="https://pay.ecourts.gov.in/epay/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-white text-blue-600 border border-blue-200 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm"
          >
            Pay Court Fees Online (ePay) <ExternalLink className="w-4 h-4" />
          </a>
          <CopySummaryButton
            summary={`Court Fees Estimate\nState: ${state}\nSuit Value: ₹${parseFloat(suitValue).toLocaleString("en-IN")}\nEstimated Court Fee: ₹${result.fee.toLocaleString("en-IN")}\nBasis: ${result.scheduleNote}`}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 5. STAMP DUTY ESTIMATOR (WOMEN REBATES & CAPS)
// ─────────────────────────────────────────────────────
function StampDutyEstimator() {
  const [propValue, setPropValue] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [result, setResult] = useState<any>(null);

  const rates: Record<string, { sd: number; reg: number }> = {
    "Andaman and Nicobar Islands": { sd: 5, reg: 1 },
    "Andhra Pradesh": { sd: 5, reg: 1 },
    "Arunachal Pradesh": { sd: 6, reg: 1 },
    Assam: { sd: 6, reg: 1 },
    Bihar: { sd: 6, reg: 2 },
    Chandigarh: { sd: 5, reg: 1 },
    Chhattisgarh: { sd: 5, reg: 1 },
    "Dadra and Nagar Haveli and Daman and Diu": { sd: 5, reg: 1 },
    Delhi: { sd: 6, reg: 1 },
    Goa: { sd: 5, reg: 1 },
    Gujarat: { sd: 4.9, reg: 1 },
    Haryana: { sd: 7, reg: 1 },
    "Himachal Pradesh": { sd: 5, reg: 1 },
    "Jammu and Kashmir": { sd: 5, reg: 1 },
    Jharkhand: { sd: 4, reg: 1 },
    Karnataka: { sd: 5.6, reg: 1 },
    Kerala: { sd: 8, reg: 2 },
    Ladakh: { sd: 5, reg: 1 },
    Lakshadweep: { sd: 5, reg: 1 },
    "Madhya Pradesh": { sd: 7.5, reg: 3 },
    Maharashtra: { sd: 6, reg: 1 },
    Manipur: { sd: 7, reg: 1 },
    Meghalaya: { sd: 6, reg: 1 },
    Mizoram: { sd: 9, reg: 1 },
    Nagaland: { sd: 8.25, reg: 1 },
    Odisha: { sd: 5, reg: 1 },
    Puducherry: { sd: 5, reg: 1 },
    Punjab: { sd: 7, reg: 1 },
    Rajasthan: { sd: 6, reg: 1 },
    Sikkim: { sd: 4, reg: 1 },
    "Tamil Nadu": { sd: 7, reg: 4 },
    Telangana: { sd: 5.5, reg: 0.5 },
    Tripura: { sd: 5, reg: 1 },
    "Uttar Pradesh": { sd: 7, reg: 1 },
    Uttarakhand: { sd: 5, reg: 1 },
    "West Bengal": { sd: 6, reg: 1 },
  };

  const calculate = () => {
    const v = parseFloat(propValue);
    if (!v || v <= 0) {
      toast.error("Enter a valid property market value");
      return;
    }
    const r = rates[state] || { sd: 5, reg: 1 };
    let sdRate = r.sd;
    let rebateNote = "";

    if (gender === "female") {
      if (state === "Maharashtra") {
        sdRate = Math.max(0, r.sd - 1);
        rebateNote = "Includes 1% Maharashtra Women Buyer rebate";
      } else if (state === "Delhi") {
        sdRate = 4;
        rebateNote = "Includes 2% Delhi Women Buyer rebate";
      } else if (state === "Haryana") {
        sdRate = Math.max(0, r.sd - 2);
        rebateNote = "Includes 2% Haryana Women Buyer rebate";
      } else if (state === "Rajasthan" || state === "Punjab") {
        sdRate = Math.max(0, r.sd - 1);
        rebateNote = `Includes 1% ${state} Women Buyer rebate`;
      }
    }

    let stamp = Math.round((v * sdRate) / 100);
    if (gender === "female" && state === "Uttar Pradesh") {
      const upRebate = Math.min(10000, Math.round(Math.min(v, 1000000) * 0.01));
      stamp = Math.max(0, stamp - upRebate);
      rebateNote = `Includes ₹${upRebate.toLocaleString("en-IN")} UP Women Buyer rebate`;
    }

    let reg = Math.round((v * r.reg) / 100);
    let regCapped = false;
    if (state === "Maharashtra" && reg > 30000) {
      reg = 30000;
      regCapped = true;
    }

    setResult({
      stamp,
      reg,
      total: stamp + reg,
      sdRate,
      regRate: r.reg,
      regCapped,
      rebateNote,
    });
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            State
          </label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setResult(null);
            }}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
          >
            {INDIA_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Buyer Gender
          </label>
          <div className="flex gap-2">
            {[
              ["male", "Male"],
              ["female", "Female"],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setGender(v as "male" | "female")}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                  gender === v
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Property Market Value (₹)
        </label>
        <input
          type="number"
          placeholder="e.g. 5000000"
          value={propValue}
          onChange={(e) => setPropValue(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
        />
      </div>
      <button
        type="button"
        onClick={calculate}
        className="w-full py-2.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors"
      >
        Estimate Stamp Duty
      </button>
      {result && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 space-y-2">
          <Row
            label={`Stamp Duty (@ ${result.sdRate}%)`}
            value={fmt(result.stamp)}
          />
          <Row
            label={`Registration Fee (@ ${result.regRate}%${
              result.regCapped ? " — capped at ₹30,000" : ""
            })`}
            value={fmt(result.reg)}
          />
          <div className="pt-2 border-t border-pink-200 flex justify-between items-center">
            <span className="text-sm font-bold text-pink-800">
              Total Payable
            </span>
            <span className="text-2xl font-bold text-pink-700">
              {fmt(result.total)}
            </span>
          </div>
          {result.rebateNote && (
            <p className="text-xs font-semibold text-pink-700">
              ✓ {result.rebateNote}
            </p>
          )}
          <p className="text-xs text-pink-600 mt-1">
            * Indicative estimate. Verify municipal/metro surcharge and ready reckoner rate before payment.
          </p>
          <a
            href={
              state === "Maharashtra"
                ? "https://igrmaharashtra.gov.in/Home"
                : "https://www.shcilestamp.com/"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-white text-pink-600 border border-pink-200 font-semibold rounded-xl hover:bg-pink-50 transition-colors text-sm"
          >
            {state === "Maharashtra"
              ? "Pay via IGR Maharashtra (GRAS)"
              : "Pay Stamp Duty Online (e-Stamping)"}{" "}
            <ExternalLink className="w-4 h-4" />
          </a>
          <CopySummaryButton
            summary={`Stamp Duty Estimate (${state}, ${gender === "female" ? "Female Buyer" : "Male Buyer"})\nProperty Value: ${fmt(parseFloat(propValue))}\nStamp Duty (${result.sdRate}%): ${fmt(result.stamp)}\nRegistration Fee (${result.regRate}%): ${fmt(result.reg)}\nTotal Payable: ${fmt(result.total)}`}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 6. GST PENALTY CALCULATOR
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
    if (!t || !dueDate || !payDate) {
      toast.error("Please enter tax liability and dates");
      return;
    }
    const days = Math.max(
      0,
      Math.floor(
        (new Date(payDate).getTime() - new Date(dueDate).getTime()) / 86400000
      )
    );
    const netTaxLiability = Math.max(0, t - cb);
    const interest = Math.round((netTaxLiability * 18 * days) / (100 * 365));
    const maxLateFee = 5000;
    const lateFee = days > 0 ? Math.min(days * 50, maxLateFee) : 0;
    setResult({ days, interest, lateFee, total: t + interest + lateFee });
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Net Tax Liability (₹)
          </label>
          <input
            type="number"
            placeholder="e.g. 50000"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
          />
        </div>
        <div>
          <label
            className="block text-xs font-semibold text-gray-600 mb-1.5"
            title="Minimum Cash Balance in Electronic Cash Ledger"
          >
            Min ECL Balance (₹) (Optional)
          </label>
          <input
            type="number"
            placeholder="e.g. 10000"
            value={cashBalance}
            onChange={(e) => setCashBalance(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Date of Payment
          </label>
          <input
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={calculate}
        className="w-full py-2.5 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors"
      >
        Calculate Late Fee &amp; Interest
      </button>
      {result && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-2">
          <Row label="Delay" value={`${result.days} days`} />
          <Row label="Interest @ 18% p.a." value={fmt(result.interest)} />
          <Row
            label="Late Fee (@ ₹50/day, max ₹5,000)"
            value={fmt(result.lateFee)}
          />
          <div className="pt-2 border-t border-violet-200 flex justify-between items-center">
            <span className="text-sm font-bold text-violet-800">
              Total Liability
            </span>
            <span className="text-2xl font-bold text-violet-700">
              {fmt(result.total)}
            </span>
          </div>
          <p className="text-[10px] text-violet-600 mt-2">
            * Excludes Section 73/74 penalties applicable on adjudication/SCN.
          </p>
          <CopySummaryButton
            summary={`GST Delay Interest & Late Fee Estimate\nNet Tax: ${fmt(parseFloat(tax))} | Delay: ${result.days} days\nInterest @ 18% p.a.: ${fmt(result.interest)}\nLate Fee: ${fmt(result.lateFee)}\nTotal Liability: ${fmt(result.total)}`}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
const TOOLS = [
  {
    id: "limitation",
    label: "Limitation Calculator",
    desc: "Indian Limitation Act, Sec. 138 NI Act, MV Act 166(3), SARFAESI & Appeal deadlines",
    color: "#10B981",
    tag: "Limitation",
    component: LimitationCalculator,
  },
  {
    id: "mact",
    label: "MACT Compensation",
    desc: "Sarla Verma multipliers, Pranay Sethi future prospects & disability claims",
    color: "#0EA5E9",
    tag: "Motor Vehicles",
    component: MACTCalculator,
  },
  {
    id: "interest",
    label: "Interest Calculator",
    desc: "Calculate pendente lite, future, simple & compound interest",
    color: "#F59E0B",
    tag: "Finance",
    component: InterestCalculator,
  },
  {
    id: "gst",
    label: "GST Penalty Calc",
    desc: "Late fee & 18% interest calculation for GST return delay",
    color: "#8B5CF6",
    tag: "Taxation",
    component: GSTCalculator,
  },
  {
    id: "courtfees",
    label: "Court Fees Calculator",
    desc: "State-wise ad-valorem court fee calculator with major state schedules",
    color: "#3B82F6",
    tag: "Civil",
    component: CourtFeesCalculator,
  },
  {
    id: "stampduty",
    label: "Stamp Duty Estimator",
    desc: "State conveyance stamp duty, women buyer rebates & registration caps",
    color: "#EC4899",
    tag: "Property",
    component: StampDutyEstimator,
  },
];

function renderToolIcon(id: string, className: string, color?: string) {
  switch (id) {
    case "limitation":
      return <Calculator className={className} style={{ color }} />;
    case "mact":
      return <Scale className={className} style={{ color }} />;
    case "interest":
      return <Zap className={className} style={{ color }} />;
    case "gst":
      return <IndianRupee className={className} style={{ color }} />;
    case "courtfees":
      return <PieChart className={className} style={{ color }} />;
    default:
      return <FileDiff className={className} style={{ color }} />;
  }
}

export default function ToolsPage() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const toolParam = new URLSearchParams(window.location.search).get("tool");
    if (toolParam && TOOLS.some((t) => t.id === toolParam)) {
      setActive(toolParam);
    }
  }, []);

  const tool = TOOLS.find((t) => t.id === active);
  const ToolComponent = tool?.component;

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header
        title="Tools & Calculators"
        subtitle="Indian legal statutory deadlines, MACT, court fee, stamp duty, and financial calculators"
      />
      <div className="p-6 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TOOLS.map((t, i) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActive(t.id)}
                    className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col text-left hover:border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ background: `${t.color}1A` }}
                      >
                        {renderToolIcon(t.id, "w-6 h-6", t.color)}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md text-gray-500 bg-gray-50 border border-gray-100">
                        {t.tag}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2 group-hover:text-sidebar transition-colors">
                      {t.label}
                    </h3>
                    <p className="text-[13px] text-gray-500 flex-1">{t.desc}</p>
                    <div
                      className="mt-4 text-xs font-semibold flex items-center gap-1"
                      style={{ color: t.color }}
                    >
                      Open Calculator →
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="calc"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={() => setActive(null)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Calculators
              </button>
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-5 border-b border-gray-100"
                    style={{ background: `${tool?.color}08` }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${tool?.color}20` }}
                    >
                      {tool && renderToolIcon(tool.id, "w-5 h-5", tool.color)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {tool?.label}
                      </h2>
                      <p className="text-xs text-gray-500">{tool?.desc}</p>
                    </div>
                  </div>
                  <div className="p-6">{ToolComponent && <ToolComponent />}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
