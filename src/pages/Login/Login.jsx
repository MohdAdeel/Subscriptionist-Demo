import React from "react";

function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05024e] via-[#09093f] to-[#0f0b40] flex items-center justify-center px-4 py-8 text-white">
      <section className="w-full max-w-md bg-[rgba(13,9,56,0.85)] border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(3,4,40,0.55)] p-10 space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">Subscriptionist</p>
          <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
          <p className="text-base text-white/70 leading-relaxed">
            Insights, renewals, and spend in one beautiful control room. Sign in to explore your
            subscriptions at a glance.
          </p>
        </div>

        <div className="space-y-4">
          <button className="w-full rounded-2xl bg-gradient-to-r from-[#2f61ff] to-[#00d1ff] py-3 text-base font-semibold shadow-[0_8px_20px_rgba(40,96,255,0.45)] transition hover:-translate-y-0.5">
            Continue with Email
          </button>
          <button className="w-full rounded-2xl border border-white/30 py-3 text-base font-semibold text-white/90 transition hover:bg-white/5">
            Sign in with Workspace
          </button>
        </div>

        <p className="text-xs text-white/60">
          Need access? Request an invite or reach out to your account team for setup assistance.
        </p>
      </section>
    </div>
  );
}

export default Login;
