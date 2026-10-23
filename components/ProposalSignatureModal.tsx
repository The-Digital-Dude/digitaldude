"use client";

import { useRef, useState, useEffect } from "react";
import { X, CheckCircle2, ShieldCheck, PenTool, Type, AlertCircle, Loader2 } from "lucide-react";
import { Proposal } from "@/lib/content/proposals";

interface Props {
  proposal: Proposal;
  isOpen: boolean;
  onClose: () => void;
  onSigned: (data: { agreementHash: string; signedAt: string; signedByName: string; signedByTitle: string }) => void;
}

export function ProposalSignatureModal({ proposal, isOpen, onClose, onSigned }: Props) {
  const [tab, setTab] = useState<"type" | "draw">("type");
  const [name, setName] = useState(proposal.client_name || "");
  const [title, setTitle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a4e";
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  if (!isOpen) return null;

  async function handleSign() {
    setError(null);
    if (!name.trim()) {
      setError("Please enter your full legal name.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter your professional job title.");
      return;
    }
    if (!agreed) {
      setError("You must acknowledge and accept the terms of engagement.");
      return;
    }

    let signatureData = "";
    if (tab === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        setError("Please draw your signature in the signature box.");
        return;
      }
      signatureData = canvasRef.current.toDataURL("image/png");
    } else {
      signatureData = `typed:${name.trim()}`;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.slug}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedByName: name.trim(),
          signedByTitle: title.trim(),
          signedSignatureData: signatureData,
          agreedToTerms: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to execute agreement. Please try again.");
        setSubmitting(false);
        return;
      }

      onSigned({
        agreementHash: data.agreementHash,
        signedAt: data.signedAt || new Date().toISOString(),
        signedByName: name.trim(),
        signedByTitle: title.trim(),
      });
    } catch (err: any) {
      setError(err?.message || "An unexpected network error occurred.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-navy transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple/10 text-purple">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-navy">Execute Technical Specification</h2>
            <p className="text-xs text-slate-500">Legal sign-off &amp; project kickoff authorization</p>
          </div>
        </div>

        {/* Agreement summary snapshot */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-600 space-y-1.5">
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">Project:</span>
            <span className="font-bold text-navy text-right">{proposal.project_title}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">Company:</span>
            <span className="font-semibold text-slate-700">{proposal.company_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">Agreed Budget:</span>
            <span className="font-bold text-purple">{proposal.budget_range}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">Delivery Roadmap:</span>
            <span className="font-semibold text-slate-700">{proposal.target_timeline}</span>
          </div>
        </div>

        {/* Signer inputs */}
        <div className="mt-5 space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-navy outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Job Title / Corporate Role
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Managing Director, Head of Logistics"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-navy outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition"
            />
          </div>

          {/* Signature method selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Signature
              </label>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setTab("type")}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${
                    tab === "type" ? "bg-white text-navy shadow-xs" : "text-slate-500"
                  }`}
                >
                  <Type size={11} /> Type
                </button>
                <button
                  type="button"
                  onClick={() => setTab("draw")}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${
                    tab === "draw" ? "bg-white text-navy shadow-xs" : "text-slate-500"
                  }`}
                >
                  <PenTool size={11} /> Draw
                </button>
              </div>
            </div>

            {tab === "type" ? (
              <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4">
                <span className="font-serif italic text-2xl text-navy tracking-wide">
                  {name.trim() || "Your Signature"}
                </span>
              </div>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={80}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-20 rounded-xl border-2 border-dashed border-slate-200 bg-white cursor-crosshair touch-none"
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute right-2 bottom-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-navy"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Terms checkbox */}
          <label className="mt-3 flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-purple focus:ring-purple"
            />
            <span>
              I accept the architecture deliverables, milestone timeline, and agreed budget on behalf of{" "}
              <strong>{proposal.company_name}</strong> and authorize The Digital Dude to proceed with kickoff.
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSign}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-md shadow-purple/20 disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Executing Agreement…
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Execute &amp; Kick Off
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
