"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Compass
} from "lucide-react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogin = () => {
    if (!email || !password) {
      setStatusMessage("Please enter your email and password.");
      return;
    }
    setStatusMessage("Authenticating with MTS Decor Cloud...");
    setTimeout(() => {
      setStatusMessage("Signed in successfully! Redirecting...");
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[140px]" />

      {/* Left Column: Premium Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16 z-10">
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                MTS Decor
              </span>
              <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Measurement Suite
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Back to Home <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Center: Main Form Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Civil & Interior Platform</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to manage projects, measurement sheets, and billing.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Work Email or Username
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="engineer@mtsdecor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-muted/30 border-input/60 focus:border-purple-500 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <Link
                  href="/contact"
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border-input/60 focus:border-purple-500 rounded-lg text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & 2FA Info */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="remember"
                  className="text-xs font-normal text-muted-foreground cursor-pointer"
                >
                  Remember for 30 days
                </Label>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>2FA Secured</span>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-700 dark:text-purple-300">
                {statusMessage}
              </div>
            )}

            {/* Liquid Metal Button Integration */}
            <div className="pt-3 flex flex-col items-center gap-3">
              <div className="w-full flex items-center justify-center py-2">
                <LiquidMetalButton
                  label="Sign In"
                  onClick={handleLogin}
                  viewMode="text"
                />
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Interactive liquid metal shader button with dynamic 3D tilt & ripple
              </p>
            </div>
          </form>

          {/* Social / SSO Alternative */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-background px-3 text-[11px] font-medium uppercase text-muted-foreground">
                or sign in with company SSO
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-card hover:bg-accent/50 text-xs font-medium transition-colors"
              >
                <Building2 className="h-4 w-4 text-purple-600" />
                Enterprise SSO
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-card hover:bg-accent/50 text-xs font-medium transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Civil ID Pass
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/contact"
              className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Request Access
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground pt-4 border-t border-border/40">
          <span>© 2026 MTS Decor. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/faq" className="hover:underline">
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Visual Showcase with Unsplash High-Res Image */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 flex-col justify-between p-12 bg-zinc-950 text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
            alt="Modern Architectural Interior"
            className="h-full w-full object-cover opacity-45 scale-105 transition-transform duration-1000 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30" />
        </div>

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Measurement Engine v2.4 Active</span>
          </div>

          {/* Interactive Icon Shader Button Demonstration */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Quick Trigger:</span>
            <LiquidMetalButton viewMode="icon" />
          </div>
        </div>

        {/* Bottom Feature Card & Founder Quote */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-zinc-950 text-sm shadow-md">
                MS
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Madanlal T Suthar</p>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Founder & Master Craftsman</p>
              </div>
            </div>
            <p className="text-sm italic text-zinc-200 leading-relaxed">
              &ldquo;True quality starts where no one looks—in the concrete, framing, and waterproofing—long before the marble is laid or the lighting is installed.&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-xl font-bold text-white">99.98%</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Billing Precision</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-xl font-bold text-white">50k+</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Sheets Computed</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-xl font-bold text-white">Zero</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Quant Discrepancy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
