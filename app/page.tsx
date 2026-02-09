"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { formatSummary, summarizeDiff } from "../lib/diffSummary";

const FREE_LIMIT = 300;
const PRO_LIMIT = 5000;
const LICENSE_STORAGE_KEY = "patchnote-license";
const DIFF_COMMAND = "git diff > changes.diff";
function getStripePromise() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return key ? loadStripe(key) : null;
}

export default function HomePage() {
  const [diffText, setDiffText] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<{ message: string; tone: "ok" | "error" } | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(LICENSE_STORAGE_KEY);
    if (stored) {
      setLicenseKey(stored);
    }
  }, []);

  const isPro = Boolean(licenseKey);
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
  const lineCount = useMemo(() => diffText.split(/\r?\n/).length, [diffText]);
  const overLimit = lineCount > limit;

  const explain = () => {
    setStatus(null);
    const summaries = summarizeDiff(diffText.trim());
    setSummary(formatSummary(summaries));
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      setDiffText(text);
      setFileName(file.name);
      setStatus({ message: `Loaded ${file.name}.`, tone: "ok" });
    } catch (error) {
      setStatus({ message: "Failed to read file.", tone: "error" });
    }
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        let message = "Checkout failed";
        try {
          const errorBody = (await res.json()) as { error?: string };
          if (errorBody?.error) {
            message = errorBody.error;
          }
        } catch (parseError) {
          // ignore parsing error
        }
        throw new Error(message);
      }
      const data = (await res.json()) as { url?: string; id?: string };
      if (data.id) {
        const stripePromise = getStripePromise();
        const stripe = stripePromise ? await stripePromise : null;
        if (stripe) {
          const result = await stripe.redirectToCheckout({ sessionId: data.id });
          if (!result.error) {
            return;
          }
        }
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Missing checkout URL");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not start checkout. Please try again.";
      setStatus({ message, tone: "error" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setStatus({ message: "Summary copied.", tone: "ok" });
    } catch (error) {
      setStatus({ message: "Copy failed.", tone: "error" });
    }
  };

  const exportSummary = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diff-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyDiffCommand = async () => {
    try {
      await navigator.clipboard.writeText(DIFF_COMMAND);
      setStatus({ message: "Command copied.", tone: "ok" });
    } catch (error) {
      setStatus({ message: "Copy failed.", tone: "error" });
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>patchnote</h1>
          <p>Paste a git diff. Get a calm, file-grouped summary.</p>
        </div>
        <div className="badge">{isPro ? "Pro unlocked" : "Free"}</div>
      </div>

      <textarea
        placeholder="Paste your git diff here..."
        value={diffText}
        onChange={(event) => setDiffText(event.target.value)}
      />

      <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
        <label className="badge" style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept=".diff,.patch,.txt"
            style={{ display: "none" }}
            onChange={(event) => handleFileUpload(event.target.files?.[0] ?? null)}
          />
          Upload diff file
        </label>
        {fileName && <div className="badge">Loaded: {fileName}</div>}
        <div className="badge">Tip: create a .diff file</div>
      </div>

      <div className="row" style={{ marginTop: 8, alignItems: "center" }}>
        <code className="badge" style={{ fontFamily: "\"JetBrains Mono\", ui-monospace" }}>
          {DIFF_COMMAND}
        </code>
        <button className="secondary" onClick={copyDiffCommand} aria-label="Copy command">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>

      <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
        <button
          className="primary"
          onClick={explain}
          disabled={!diffText.trim() || overLimit}
        >
          Explain changes
        </button>
        {!isPro && (
          <button className="ghost" onClick={startCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? "Opening checkout..." : "Upgrade to Pro"}
          </button>
        )}
        {isPro && summary && (
          <>
            <button className="secondary" onClick={copySummary}>
              Copy summary
            </button>
            <button className="secondary" onClick={exportSummary}>
              Export
            </button>
          </>
        )}
        <div className="badge">
          {lineCount} / {limit} lines
        </div>
      </div>

      {overLimit && (
        <div className="notice">Limit exceeded. Free is {FREE_LIMIT} lines. Pro is {PRO_LIMIT} lines.</div>
      )}

      {status && (
        <div className={status.tone === "ok" ? "success" : "notice"}>{status.message}</div>
      )}

      {summary && <div className="output">{summary}</div>}

      <div className="footer">
        Free: up to {FREE_LIMIT} lines. Pro: up to {PRO_LIMIT} lines + copy/export.
      </div>
    </div>
  );
}
