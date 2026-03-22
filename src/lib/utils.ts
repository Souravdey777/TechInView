import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatScore(score: number): string {
  if (score >= 93) return "A+";
  if (score >= 85) return "A";
  if (score >= 78) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "F";
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-brand-green";
  if (score >= 70) return "text-brand-cyan";
  if (score >= 55) return "text-brand-amber";
  return "text-brand-rose";
}

export function getScoreBgColor(score: number): string {
  if (score >= 85) return "bg-brand-green";
  if (score >= 70) return "bg-brand-cyan";
  if (score >= 55) return "bg-brand-amber";
  return "bg-brand-rose";
}
