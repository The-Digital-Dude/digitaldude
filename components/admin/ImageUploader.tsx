"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  ImageIcon,
  Check,
  Copy,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onInsertMarkdown?: (markdown: string) => void;
  label?: string;
  description?: string;
  aspectRatio?: "video" | "square" | "any";
  enableMarkdownCopy?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  onInsertMarkdown,
  label = "Cover Image",
  description = "PNG, JPG, WebP up to 10MB",
  aspectRatio = "video",
  enableMarkdownCopy = true,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP, GIF, SVG).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      onChange(data.url);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Upload failed. Please check Supabase credentials.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }

  function handleCopy(text: string, type: "url" | "md") {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-navy/70">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition"
          >
            <Trash2 size={13} />
            Remove
          </button>
        )}
      </div>

      {value ? (
        /* Image Preview Card */
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div
            className={`relative overflow-hidden rounded-lg bg-slate-900/5 ${
              aspectRatio === "video"
                ? "aspect-video"
                : aspectRatio === "square"
                ? "aspect-square"
                : "max-h-64"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded Preview"
              className="h-full w-full object-cover"
              onError={() => setError("Could not render image URL.")}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate text-xs text-navy/60">
              <ImageIcon size={14} className="text-purple flex-shrink-0" />
              <span className="truncate max-w-[220px] font-mono">{value}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(value, "url")}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-navy/80 hover:bg-slate-100 transition"
                title="Copy Direct URL"
              >
                {copiedUrl ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copiedUrl ? "Copied" : "Copy URL"}
              </button>

              {enableMarkdownCopy && (
                <button
                  type="button"
                  onClick={() => {
                    const md = `![Image description](${value})`;
                    if (onInsertMarkdown) {
                      onInsertMarkdown(md);
                    } else {
                      handleCopy(md, "md");
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg bg-lavender px-2.5 py-1 text-xs font-semibold text-purple hover:bg-purple hover:text-white transition"
                  title="Insert or Copy Markdown snippet"
                >
                  {copiedMd ? <Check size={12} className="text-white" /> : <Sparkles size={12} />}
                  {onInsertMarkdown ? "Insert into Article" : copiedMd ? "Copied MD" : "Copy MD"}
                </button>
              )}

              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-navy/60 hover:text-navy transition"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            dragOver
              ? "border-purple bg-lavender/30"
              : "border-slate-200 bg-slate-50/70 hover:border-purple/50 hover:bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 size={28} className="animate-spin text-purple" />
              <p className="text-xs font-semibold text-navy">Uploading directly to Supabase...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-white p-3 shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud size={24} className="text-purple" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-navy/50 mt-0.5">{description}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Direct URL input fallback */}
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste direct image URL (https://...)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy placeholder-slate-400 outline-none focus:border-purple focus:bg-white transition"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
