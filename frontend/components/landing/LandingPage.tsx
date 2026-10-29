"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scale,
  Gavel,
  ArrowRight,
  CheckCircle,
  Briefcase,
  FileText,
  CreditCard,
  Shield,
  Calendar,
  Lock,
  ChevronDown,
  Menu,
  X,
  Search,
  Users,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const showcaseTabs = [
    {
      id: "dashboard",
      title: "Command Center",
      icon: Briefcase,
      desc: "Live board hearings, critical alerts, and matter pipeline in one unified view.",
      image: "/screenshots/dashboard.png",
    },
    {
      id: "cases",
      title: "Case Management",
      icon: Gavel,
      desc: "CNR number tracking, automatic cause list sync, and case history.",
      image: "/screenshots/case-management.png",
    },
    {
      id: "drafts",
      title: "Draft Automation",
      icon: FileText,
      desc: "500+ vernacular legal templates with instant matter auto-fill.",
      image: "/screenshots/draft-workspace.png",
    },
    {
      id: "billing",
      title: "GST Invoicing",
      icon: CreditCard,
      desc: "GST SAC 9982 compliant legal invoices, retainer accounts, and ledger.",
      image: "/screenshots/billing-invoicing.png",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-[#6EE7B7] selection:text-[#013B36]">
      {/* ── TOP NAVIGATION ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#013B36] to-[#014D46] flex items-center justify-center shadow-md shadow-[#013B36]/20 transition-transform group-hover:scale-105">
              <Scale className="w-5 h-5 text-[#6EE7B7]" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1">
                Fast<span className="text-[#014D46]">case</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Fastcase Platform
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#014D46] transition-colors">Features</a>
            <a href="#pillars" className="hover:text-[#014D46] transition-colors">Practice Areas</a>
            <a href="#showcase" className="hover:text-[#014D46] transition-colors">Workspace</a>
            <a href="#faq" className="hover:text-[#014D46] transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-[#013B36] hover:bg-[#014D46] text-white font-semibold text-sm transition-all shadow-md shadow-[#013B36]/20 hover:shadow-lg"
            >
              Registration
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Features
              </a>
              <a
                href="#pillars"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Practice Areas
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Workspace
              </a>
            </nav>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2.5 rounded-xl bg-[#013B36] text-white font-semibold text-sm"
              >
                Registration
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#013B36]/10 border border-[#013B36]/20 text-[#013B36] text-[11px] font-bold tracking-wider uppercase rounded-full px-3.5 py-1.5 mb-6">
                <Gavel className="w-3.5 h-3.5 text-amber-500" />
                LEGAL ERP FOR INDIAN ADVOCATES
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-[900] text-slate-900 leading-[1.22] tracking-tight mb-5">
                Everything Your Legal Practice Needs,{" "}
                <span className="text-[#014D46]">Unified.</span>
              </h1>

              <p className="text-[16px] sm:text-[17px] text-slate-600 leading-relaxed mb-8 max-w-xl">
                Automate case lifecycles, court cause lists, 500+ vernacular drafts, and GST-compliant fee billing from one secure platform.
              </p>

              {/* Primary Call-to-actions */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Link
                  href="/register"
                  className="px-7 py-3 rounded-xl bg-[#013B36] hover:bg-[#014D46] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#013B36]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Registration <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="px-7 py-3 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-sm shadow-xs hover:bg-slate-50 transition-all"
                >
                  Advocate Login
                </Link>
              </div>

              {/* Trust Checkmarks */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 14-Day Free Trial
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 100% Indian Cloud Data
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Bar Council Compliant
                </span>
              </div>
            </div>

            {/* Right Mockup */}
            <div className="relative w-full max-w-[620px] mx-auto lg:mx-0">
              <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(1,59,54,0.18)]">
                {/* Browser bar */}
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    app.fastcase.in/dashboard
                  </div>
                </div>
                {/* Screenshot */}
                <img
                  src="/screenshots/dashboard.png"
                  alt="Fastcase ERP Dashboard"
                  className="w-full block object-cover object-top max-h-[390px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE STRIP ────────────────────────────────────────── */}
      <section id="features" className="bg-slate-50 border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Briefcase, title: "Case Lifecycle", desc: "CNR sync & cause lists" },
              { icon: FileText, title: "500+ Drafts", desc: "English, Marathi, Hindi" },
              { icon: CreditCard, title: "GST Invoicing", desc: "SAC 9982 legal tax bills" },
              { icon: Shield, title: "Sec 126 Privilege", desc: "Encrypted client vaults" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-[#013B36]/10 text-[#013B36] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[13.5px] text-slate-900 leading-tight truncate">{title}</p>
                  <p className="text-[11.5px] text-slate-500 leading-tight mt-0.5 truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS ───────────────────────────────────────── */}
      <section id="pillars" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold text-[#013B36] uppercase tracking-widest bg-[#013B36]/10 px-3.5 py-1 rounded-full border border-[#013B36]/20">
              Core Pillars
            </span>
            <h2 className="text-2xl sm:text-3xl font-[800] text-slate-900 mt-3">
              Built for Every Day of Court Practice
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              Replace physical diary registers with an automated digital command center.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                title: "Hearing Diary & Sync",
                desc: "Automatic cause list updates, daily court board tracking, and limitation countdown alerts.",
                tag: "Court Diary",
                color: "text-amber-800 bg-amber-50 border-amber-200",
              },
              {
                icon: FileText,
                title: "Vernacular Legal Drafts",
                desc: "500+ court-verified templates with 1-click matter auto-fill in English, Marathi, Hindi, and Gujarati.",
                tag: "Templates",
                color: "text-teal-900 bg-teal-50 border-teal-200",
              },
              {
                icon: CreditCard,
                title: "GST Billing & Ledger",
                desc: "Compliant legal fee invoices, trust account retainers, and automated WhatsApp receipts.",
                tag: "Billing",
                color: "text-emerald-900 bg-emerald-50 border-emerald-200",
              },
              {
                icon: Shield,
                title: "Privileged Evidence Vault",
                desc: "Section 126 Evidence Act compliant encryption isolating client files in Indian cloud datacenters.",
                tag: "Security",
                color: "text-[#013B36] bg-[#013B36]/10 border-[#013B36]/20",
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${p.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                        {p.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-[16px] text-slate-900 mb-2 leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-[13px] text-slate-600 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WORKSPACE SHOWCASE TABS ────────────────────────────── */}
      <section id="showcase" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold text-[#013B36] uppercase tracking-widest bg-[#013B36]/10 px-3.5 py-1 rounded-full border border-[#013B36]/20">
              Interactive Workspace
            </span>
            <h2 className="text-2xl sm:text-3xl font-[800] text-slate-900 mt-3">
              Explore the Advocate Operating System
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Designed specifically for high-volume courtroom workflows.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {showcaseTabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                    isActive
                      ? "bg-[#013B36] text-white shadow-md shadow-[#013B36]/20"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.title}
                </button>
              );
            })}
          </div>

          {/* Active Tab Screen */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden max-w-5xl mx-auto">
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xs font-semibold text-slate-600">
                {showcaseTabs[activeTab].desc}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                fastcase.in
              </div>
            </div>
            <img
              src={showcaseTabs[activeTab].image}
              alt={showcaseTabs[activeTab].title}
              className="w-full block object-cover object-top max-h-[500px]"
            />
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ──────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-[#013B36] to-[#014D46] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-[900] tracking-tight mb-4">
            Ready to Streamline Your High Court & District Practice?
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto mb-8">
            Join hundreds of advocates running organized, compliant, and automated legal offices on Fastcase.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-[#6EE7B7] text-[#013B36] font-bold text-sm shadow-lg hover:shadow-xl hover:bg-[#86efac] transition-all"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl border-2 border-white/40 hover:border-white text-white font-bold text-sm hover:bg-white/10 transition-all"
            >
              Advocate Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#013B36] flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#6EE7B7]" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Fastcase</span>
              <p className="text-[11px] text-slate-500">Legal ERP for Indian Advocates</p>
            </div>
          </div>
          <p className="text-center md:text-right text-[11px] text-slate-500 max-w-md">
            As per the rules of the Bar Council of India, this platform is for practice management, case administration, and workflow automation.
          </p>
          <div className="text-slate-500">
            © {new Date().getFullYear()} Fastcase Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
