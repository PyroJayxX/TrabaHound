"use client";

import { DM_Mono, DM_Sans } from "next/font/google";
import { useMemo, useRef, useState } from "react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: { company: string; role: string; duration: string; description: string }[];
  education: { institution: string; degree: string; year: string }[];
  certifications: string[];
};

function isAcceptedFile(file: File) {
  const lower = file.name.toLowerCase();
  return lower.endsWith(".pdf") || lower.endsWith(".docx");
}

export default function ResumeUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const skillTags = useMemo(() => parsed?.skills ?? [], [parsed]);

  async function uploadResume(file: File) {
    if (!isAcceptedFile(file)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsed(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const rawBody = await res.text();
      const data = (() => {
        try {
          return JSON.parse(rawBody) as ParsedResume | { error?: string };
        } catch {
          return null;
        }
      })();

      if (!res.ok) {
        const message =
          data && "error" in data && data.error
            ? data.error
            : rawBody.includes("<!DOCTYPE")
              ? "Server returned HTML instead of JSON. Check your API route and server logs."
              : "Upload failed.";
        throw new Error(message);
      }

      if (!data) {
        throw new Error("Server response was not valid JSON.");
      }

      setParsed(data as ParsedResume);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void uploadResume(file);
    }
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void uploadResume(file);
    }
  }

  return (
    <section
      className={`${dmSans.variable} ${dmMono.variable} min-h-screen bg-[#0a0a0b] p-6 text-zinc-100 sm:p-10`}
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p
            className="text-xs uppercase tracking-[0.28em] text-[#e8ff47]"
            style={{ fontFamily: "var(--font-dm-mono), monospace" }}
          >
            Resume Parser
          </p>
          <h1
            className="mt-2 text-3xl font-medium sm:text-4xl"
            style={{ fontFamily: "var(--font-dm-mono), monospace" }}
          >
            Upload Your Resume
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Drop a PDF or DOCX file and extract structured resume details powered by Gemini.
          </p>
        </header>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border p-8 transition-all ${
            isDragging
              ? "border-[#e8ff47] bg-[#131316] shadow-[0_0_0_1px_#e8ff47_inset]"
              : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onInputChange}
          />

          <div className="flex flex-col items-center justify-center text-center">
            <span
              className="rounded-full border border-[#e8ff47]/40 bg-[#e8ff47]/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#e8ff47]"
              style={{ fontFamily: "var(--font-dm-mono), monospace" }}
            >
              PDF or DOCX
            </span>
            <h2 className="mt-4 text-xl font-medium">Drag and drop your resume</h2>
            <p className="mt-2 text-sm text-zinc-400">or click to browse from your device</p>
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-200">
            Parsing resume, please wait...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {parsed && (
          <article className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-6">
            <h3
              className="text-lg font-medium text-[#e8ff47]"
              style={{ fontFamily: "var(--font-dm-mono), monospace" }}
            >
              Parsed Summary
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Name</p>
                <p className="mt-1 text-sm text-zinc-100">{parsed.name || "Not found"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Experience Entries</p>
                <p className="mt-1 text-sm text-zinc-100">{parsed.experience.length}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skillTags.length > 0 ? (
                  skillTags.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#e8ff47]/40 bg-[#e8ff47]/10 px-3 py-1 text-xs text-[#e8ff47]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">No skills extracted.</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Education</p>
                {parsed.education.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                    {parsed.education.map((item, index) => (
                      <li key={`${item.institution}-${index}`}>
                        {item.degree} - {item.institution} {item.year ? `(${item.year})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">No education entries extracted.</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Certifications</p>
                {parsed.certifications.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                    {parsed.certifications.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">No certifications extracted.</p>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
