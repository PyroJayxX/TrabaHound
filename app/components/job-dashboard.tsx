"use client";

import { DM_Mono, DM_Sans } from "next/font/google";
import { useEffect, useMemo, useState } from "react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

type ResumeData = {
  skills: string[];
  experience: { company: string; role: string; duration: string; description: string }[];
  education: { institution: string; degree: string; year: string }[];
  certifications: string[];
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: "remote" | "hybrid" | "onsite";
  platform: "Indeed" | "LinkedIn";
  url: string;
  description: string;
  matchedSkills: string[];
};

type CrawlResponse = {
  jobs?: Job[];
  error?: string;
};

const modeBadgeClasses: Record<Job["mode"], string> = {
  remote: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
  hybrid: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  onsite: "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
};

function modeLabel(mode: Job["mode"]) {
  if (mode === "onsite") {
    return "Onsite";
  }
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function normalizeSkill(value: string) {
  return value.trim().toLowerCase();
}

export default function JobDashboard({
  resumeData,
  onStatusChange,
}: {
  resumeData: ResumeData;
  onStatusChange?: (status: "idle" | "crawling" | "ready" | "error") => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function crawlJobs() {
      setIsLoading(true);
      setError(null);
      onStatusChange?.("crawling");

      try {
        const response = await fetch("/api/crawl-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resumeData),
        });

        const raw = await response.text();
        let data: CrawlResponse | null = null;
        try {
          data = JSON.parse(raw) as CrawlResponse;
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to crawl job listings.");
        }

        if (isMounted) {
          setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
          onStatusChange?.("ready");
        }
      } catch (crawlError) {
        if (isMounted) {
          setError(crawlError instanceof Error ? crawlError.message : "Failed to crawl jobs.");
          setJobs([]);
          onStatusChange?.("error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void crawlJobs();

    return () => {
      isMounted = false;
    };
  }, [onStatusChange, resumeData]);

  const filteredJobs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return jobs;
    }

    return jobs.filter((job) => {
      const haystack = [
        job.title,
        job.company,
        job.location,
        job.description,
        job.platform,
        job.matchedSkills.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [jobs, search]);

  const resumeSkillSet = useMemo(
    () => new Set((resumeData.skills ?? []).map(normalizeSkill).filter(Boolean)),
    [resumeData.skills],
  );

  function getMatchPercent(job: Job) {
    const matched = new Set(job.matchedSkills.map(normalizeSkill).filter(Boolean));
    if (resumeSkillSet.size === 0) {
      return 0;
    }

    const overlap = [...matched].filter((skill) => resumeSkillSet.has(skill)).length;
    return Math.max(0, Math.min(100, Math.round((overlap / resumeSkillSet.size) * 100)));
  }

  return (
    <section
      className={`${dmSans.variable} ${dmMono.variable} min-h-screen bg-[#0a0a0b] p-6 text-zinc-100 sm:p-8`}
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] text-[#e8ff47]"
              style={{ fontFamily: "var(--font-dm-mono), monospace" }}
            >
              Job Listings
            </p>
            <h2
              className="mt-2 text-2xl font-medium sm:text-3xl"
              style={{ fontFamily: "var(--font-dm-mono), monospace" }}
            >
              Matched Opportunities
            </h2>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs, company, skill"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100 outline-none ring-[#e8ff47]/50 placeholder:text-zinc-500 focus:ring-2 sm:max-w-sm"
          />
        </header>

        {isLoading && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            Crawling Indeed and LinkedIn...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredJobs.length === 0 && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            No jobs found yet. Try adjusting resume skills or search keyword.
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5 text-left transition-colors hover:border-[#e8ff47]/50"
            >
              <button
                type="button"
                onClick={() => setSelectedJob(job)}
                className="w-full text-left"
              >
                <h3
                  className="text-xl text-zinc-100"
                  style={{ fontFamily: "var(--font-dm-mono), monospace" }}
                >
                  {job.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-300">{job.company}</p>
                <p className="text-sm text-zinc-500">{job.location}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${modeBadgeClasses[job.mode]}`}>
                    {modeLabel(job.mode)}
                  </span>
                  <span className="rounded-full border border-zinc-600/50 bg-zinc-600/10 px-2.5 py-1 text-xs text-zinc-300">
                    Source: {job.platform}
                  </span>
                  <span className="rounded-full border border-[#e8ff47]/40 bg-[#e8ff47]/10 px-2.5 py-1 text-xs text-[#e8ff47]">
                    Match: {getMatchPercent(job)}%
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.matchedSkills.slice(0, 6).map((skill) => (
                    <span
                      key={`${job.id}-${skill}`}
                      className="rounded-full border border-[#e8ff47]/40 bg-[#e8ff47]/10 px-2.5 py-1 text-[11px] text-[#e8ff47]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </button>

              <div className="mt-4 border-t border-zinc-700/70 pt-4">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded border border-[#e8ff47]/40 bg-[#e8ff47]/10 px-3 py-1.5 text-xs text-[#e8ff47]"
                >
                  Go to Posting
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[1px]"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-zinc-700 bg-[#0d0d0f] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#e8ff47]">{selectedJob.platform}</p>
                <h3
                  className="mt-2 text-2xl text-zinc-100"
                  style={{ fontFamily: "var(--font-dm-mono), monospace" }}
                >
                  {selectedJob.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {selectedJob.company} - {selectedJob.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-400"
              >
                Close
              </button>
            </div>

            <a
              href={selectedJob.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded border border-[#e8ff47]/40 bg-[#e8ff47]/10 px-3 py-1.5 text-xs text-[#e8ff47]"
            >
              Open Original Listing
            </a>

            <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Description</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                {selectedJob.description || "No description provided by source."}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-[#e8ff47]/20 bg-[#e8ff47]/5 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#e8ff47]">Skill Gap Analysis (MVP 4)</p>
              <p className="mt-2 text-sm text-zinc-300">
                Placeholder: compare required job skills against resume skills and suggest a learning plan.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
