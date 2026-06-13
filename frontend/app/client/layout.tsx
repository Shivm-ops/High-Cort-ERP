import React from "react";
import Link from "next/link";
import { Scale, LogOut, FileText, Calendar, Bell } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F8F6] flex flex-col">
      {/* Client Portal Header */}
      <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-bold text-gray-900 text-lg">Fastcase <span className="text-blue-600 font-normal">Client Portal</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              ME
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
