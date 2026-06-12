import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export const STATUS_COLORS: Record<string, string> = {
  active: "badge-active",
  pending: "badge-pending",
  urgent: "badge-urgent",
  completed: "badge-completed",
  hearing: "badge-hearing",
  filed: "badge-hearing",
  "in-progress": "badge-active",
  closed: "badge-completed",
};

export const COURT_NAMES = [
  "Supreme Court of India",
  "Bombay High Court",
  "Delhi High Court",
  "Madras High Court",
  "Calcutta High Court",
  "Allahabad High Court",
  "Gujarat High Court",
  "Karnataka High Court",
  "Rajasthan High Court",
  "Punjab & Haryana High Court",
  "District Court",
  "Sessions Court",
  "Civil Court",
  "Family Court",
  "Consumer Forum",
  "NCLT",
  "NCLAT",
  "ITAT",
  "GST Tribunal",
  "RERA Authority",
];

export const PRACTICE_AREAS = [
  "Criminal Law",
  "Civil Law",
  "Family Law",
  "Property Law",
  "Corporate Law",
  "GST & Taxation",
  "Banking & Finance",
  "Arbitration",
  "Consumer Law",
  "Cyber Law",
  "Labour Law",
  "Intellectual Property",
  "MACT",
  "SARFAESI",
  "RERA",
];
