"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const LICENSE_STORAGE_KEY = "diff-explainer-license";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; tone: "ok" | "error" } | null>(
    null
  );

  useEffect(() => {
    if (!sessionId) {
      setStatus({ message: "Missing session id.", tone: "error" });
      return;
    }

    const fetchEntitlement = async () => {
      try {
        const res = await fetch(`/api/entitlement?session_id=${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch entitlement");
        }
        const data = (await res.json()) as { licenseKey?: string };
        if (data.licenseKey) {
          setLicenseKey(data.licenseKey);
        } else {
          setStatus({ message: "No license key returned.", tone: "error" });
        }
      } catch (error) {
        setStatus({ message: "Unable to fetch license key.", tone: "error" });
      }
    };

    fetchEntitlement();
  }, [sessionId]);

  const activate = () => {
    if (!licenseKey) {
      return;
    }
    window.localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);
    setStatus({ message: "Pro unlocked. You can close this page.", tone: "ok" });
  };

  return (
    <div className="card">
      <h1>Success</h1>
      <p>Your checkout is complete. Grab your license key and activate Pro.</p>

      {!licenseKey && !status && <div className="output">Loading license key...</div>}
      {licenseKey && <div className="output">{licenseKey}</div>}
      {status && (
        <div className={status.tone === "ok" ? "success" : "notice"}>{status.message}</div>
      )}

      {licenseKey && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" onClick={activate}>
            Activate
          </button>
          <a href="/" className="badge">
            Back to app
          </a>
        </div>
      )}
    </div>
  );
}
