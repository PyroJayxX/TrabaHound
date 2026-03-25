"use client";

import { useMemo, useState } from "react";
import Sidebar from "@/app/components/sidebar";
import JobCard from "@/app/components/job-card";
import ResumeRequiredModal from "@/app/components/resume-required-modal";

type Screen = "Profile" | "Dashboard" | "Saved Jobs" | "Skill Gap";

type Profile = {
  fullName: string;
  address: string;
  contact: string;
  email: string;
  education: string;
  certifications: string;
  experience: string;
  skills: string[];
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  source: string;
  postingUrl: string;
  match: number;
  skills: string[];
  requiredSkills: string[];
  recommendation: string;
};

type DonutMetric = {
  label: string;
  value: number;
  color: string;
  subtitle: string;
};

const EMPTY_PROFILE: Profile = {
  fullName: "",
  address: "",
  contact: "",
  email: "",
  education: "",
  certifications: "",
  experience: "",
  skills: [],
};

const ALL_JOBS: Job[] = [
  {
    id: "j1",
    title: "Data Analyst",
    company: "Helix Commerce",
    location: "Taguig, PH",
    mode: "Hybrid",
    source: "LinkedIn",
    postingUrl: "https://www.linkedin.com/jobs/",
    match: 89,
    skills: ["Python", "SQL", "Tableau"],
    requiredSkills: ["SQL", "Tableau", "Data Modeling", "Python"],
    recommendation: "Learn advanced SQL joins to improve match from 65% to 90%.",
  },
  {
    id: "j2",
    title: "Business Intelligence Associate",
    company: "Northstar Lending",
    location: "Makati, PH",
    mode: "On-site",
    source: "Indeed",
    postingUrl: "https://www.indeed.com/jobs",
    match: 82,
    skills: ["Power BI", "Excel", "ETL"],
    requiredSkills: ["Power BI", "ETL", "DAX", "SQL"],
    recommendation: "Study DAX and SQL query tuning for stronger BI performance.",
  },
  {
    id: "j3",
    title: "Product Data Specialist",
    company: "Atlas Retail Labs",
    location: "Remote - APAC",
    mode: "Remote",
    source: "JobStreet",
    postingUrl: "https://www.jobstreet.com.ph/en/job-search/jobs/",
    match: 76,
    skills: ["Analytics", "A/B Testing", "SQL"],
    requiredSkills: ["A/B Testing", "SQL", "Experiment Design", "Python"],
    recommendation: "Improve experiment design to move from 70% to 88% match.",
  },
];

const SAVED_JOB_IDS = ["j2", "j3"];

function infoOrNotFound(value: string) {
  return value.trim().length > 0 ? value : "Not Found";
}

function DonutStat({ label, value, color, subtitle }: DonutMetric) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <div className="mt-3 flex items-center gap-4">
        <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
          <circle cx="48" cy="48" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 48 48)"
          />
          <text x="48" y="52" textAnchor="middle" className="fill-white text-[16px] font-semibold">
            {value}%
          </text>
        </svg>
        <p className="text-sm text-zinc-300">{subtitle}</p>
      </div>
    </article>
  );
}

function MatchTrendGraph() {
  const points = [58, 63, 67, 72, 78, 81, 86];
  const stepX = 56;
  const startX = 20;
  const chartHeight = 120;

  const polylinePoints = points
    .map((value, idx) => {
      const x = startX + idx * stepX;
      const y = 16 + (100 - value) * (chartHeight / 100);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:col-span-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
            Weekly Match Trend
          </h3>
          <p className="mt-1 text-xs text-zinc-500">Dummy data from saved jobs upskilling progress</p>
        </div>
        <span className="rounded border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs font-medium text-emerald-200">
          +28 pts in 7 weeks
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg width="420" height="180" viewBox="0 0 420 180" className="min-w-[420px]">
          <line x1="20" y1="136" x2="392" y2="136" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <line x1="20" y1="16" x2="20" y2="136" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((value, idx) => {
            const x = startX + idx * stepX;
            const y = 16 + (100 - value) * (chartHeight / 100);
            return (
              <g key={`point-${value}-${idx}`}>
                <circle cx={x} cy={y} r="4" fill="#e8ff47" />
                <text x={x} y="154" textAnchor="middle" className="fill-zinc-500 text-[11px]">
                  W{idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </article>
  );
}

export default function Home() {
  const [active, setActive] = useState<Screen>("Profile");
  const [hasResume, setHasResume] = useState(false);
  const [showResumeRequired, setShowResumeRequired] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(true);
  const [newSkill, setNewSkill] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(ALL_JOBS[0].id);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);

  const selectedJob = useMemo(
    () => ALL_JOBS.find((job) => job.id === selectedJobId) ?? ALL_JOBS[0],
    [selectedJobId],
  );

  const savedJobs = useMemo(
    () => ALL_JOBS.filter((job) => SAVED_JOB_IDS.includes(job.id)),
    [],
  );

  const strengths = useMemo(
    () => ["Communication", "Data storytelling", "Dashboarding"],
    [],
  );

  const weaknesses = useMemo(
    () => ["Advanced SQL", "Experiment design", "Data modeling"],
    [],
  );

  const studyPlan = useMemo(
    () => [
      "Practice SQL joins + CTEs (4 hours/week)",
      "Build one mini ETL project using Python",
      "Take a DAX crash course for BI roles",
    ],
    [],
  );

  const donutMetrics: DonutMetric[] = [
    {
      label: "Skills Matched",
      value: 78,
      color: "#22d3ee",
      subtitle: "Average overlap between your profile skills and saved job requirements.",
    },
    {
      label: "Readiness Score",
      value: 71,
      color: "#a3e635",
      subtitle: "Current qualification readiness based on curated and saved roles.",
    },
    {
      label: "Critical Gaps Closed",
      value: 42,
      color: "#fda4af",
      subtitle: "Portion of top recurring skill gaps already addressed in your plan.",
    },
  ];

  const handleNavigate = (next: string) => {
    if (next === "Logout") {
      setActive("Profile");
      setHasResume(false);
      setProfile(EMPTY_PROFILE);
      setIsEditingProfile(true);
      setShowResumeRequired(false);
      return;
    }

    const target = next as Screen;
    if (!hasResume && target !== "Profile") {
      setShowResumeRequired(true);
      return;
    }

    setActive(target);
  };

  const updateProfileField = (key: keyof Omit<Profile, "skills">, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const uploadMockResume = () => {
    setHasResume(true);
    setIsEditingProfile(false);
    setProfile({
      fullName: "Juan Dela Cruz",
      address: "Not Found",
      contact: "+63 912 345 6789",
      email: "juan.delacruz@email.com",
      education: "BS Information Systems",
      certifications: "Google Data Analytics",
      experience: "2 years as Data Analyst",
      skills: ["Python", "SQL", "Tableau", "Excel"],
    });
  };

  const addSkill = () => {
    const cleaned = newSkill.trim();
    if (!cleaned) {
      return;
    }

    setProfile((prev) => {
      if (prev.skills.includes(cleaned)) {
        return prev;
      }
      return { ...prev, skills: [...prev.skills, cleaned] };
    });
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#0a0a0b] text-white"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <Sidebar active={active} onNavigate={handleNavigate} />

      <main className="flex flex-1 flex-col overflow-auto">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.07] px-6 sm:px-8">
          <h1 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            {active}
          </h1>
          <div className="flex items-center gap-3">
            <span className="rounded border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
              {hasResume ? `${ALL_JOBS.length} jobs curated` : "Upload resume to unlock"}
            </span>
            <button
              type="button"
              onClick={uploadMockResume}
              className="h-8 rounded bg-[#e8ff47] px-4 text-xs font-semibold text-black transition-opacity hover:opacity-90"
            >
              Upload Resume
            </button>
          </div>
        </header>

        <div className="flex flex-1 px-5 py-6 sm:px-8 sm:py-8">
          {active === "Profile" && (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#e8ff47]/70">Profile</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">Resume Data</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile((prev) => !prev)}
                    className="rounded border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.08]"
                  >
                    {isEditingProfile ? "View Mode" : "Edit Mode"}
                  </button>
                  {!hasResume && (
                    <button
                      type="button"
                      onClick={uploadMockResume}
                      className="rounded bg-[#e8ff47] px-3 py-1.5 text-xs font-semibold text-black"
                    >
                      Use Mock Resume
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: "Full Name", key: "fullName" as const },
                  { label: "Address", key: "address" as const },
                  { label: "Contact", key: "contact" as const },
                  { label: "Email", key: "email" as const },
                  { label: "Education", key: "education" as const },
                  { label: "Certifications", key: "certifications" as const },
                ].map((field) => (
                  <div key={field.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">{field.label}</p>
                    {isEditingProfile ? (
                      <input
                        value={profile[field.key]}
                        onChange={(e) => updateProfileField(field.key, e.target.value)}
                        className="mt-2 w-full rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 outline-none ring-[#e8ff47]/50 focus:ring-2"
                        placeholder="Not Found"
                      />
                    ) : (
                      <p className="mt-2 text-sm text-zinc-200">{infoOrNotFound(profile[field.key])}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Experience</p>
                {isEditingProfile ? (
                  <textarea
                    value={profile.experience}
                    onChange={(e) => updateProfileField("experience", e.target.value)}
                    className="mt-2 h-24 w-full resize-none rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 outline-none ring-[#e8ff47]/50 focus:ring-2"
                    placeholder="Not Found"
                  />
                ) : (
                  <p className="mt-2 text-sm text-zinc-200">{infoOrNotFound(profile.experience)}</p>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(profile.skills.length > 0 ? profile.skills : ["Not Found"]).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-zinc-200"
                    >
                      {skill}
                      {isEditingProfile && skill !== "Not Found" && (
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-zinc-400 hover:text-rose-300"
                        >
                          x
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {isEditingProfile && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="w-full rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 outline-none ring-[#e8ff47]/50 focus:ring-2"
                      placeholder="Add skill"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="rounded bg-[#e8ff47] px-3 py-2 text-xs font-semibold text-black"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {active === "Dashboard" && (
            <section className="mx-auto grid w-full max-w-6xl gap-4 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <h2 className="text-xl font-semibold text-white">Curated Job Listings</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Matched skills, title, company, location, and mode of work.
                </p>
                <div className="mt-4 space-y-3">
                  {ALL_JOBS.map((job) => (
                    <JobCard key={job.id} job={job} onClick={() => setSelectedJobId(job.id)} />
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <h3 className="text-base font-semibold text-white">Skill Gap Analysis</h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                  Selected Job
                </p>
                <p className="mt-2 text-sm text-zinc-200">{selectedJob.title}</p>
                <p className="text-sm text-zinc-400">{selectedJob.company}</p>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Required Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedJob.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
                  <p className="text-sm text-cyan-100">{selectedJob.recommendation}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Example improvement path: Learn SQL to improve match from 65% to 90%.
                  </p>
                </div>
              </aside>
            </section>
          )}

          {active === "Saved Jobs" && (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <h2 className="text-xl font-semibold text-white">Saved Jobs</h2>
              <p className="mt-1 text-sm text-zinc-400">Bookmarked jobs are kept here.</p>
              <div className="mt-4 space-y-3">
                {savedJobs.map((job) => (
                  <JobCard key={job.id} job={job} isSaved />
                ))}
              </div>
            </section>
          )}

          {active === "Skill Gap" && (
            <section className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
              {donutMetrics.map((metric) => (
                <DonutStat
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  color={metric.color}
                  subtitle={metric.subtitle}
                />
              ))}

              <MatchTrendGraph />

              <article className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5 md:col-span-1">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-200">
                  Strengths
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-zinc-100">
                  {strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-5 md:col-span-1">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-200">
                  Weaknesses
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-zinc-100">
                  {weaknesses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-[#e8ff47]/25 bg-[#e8ff47]/5 p-5 md:col-span-1">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e8ff47]">
                  Study Plan
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-zinc-100">
                  {studyPlan.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>
          )}
        </div>
      </main>

      <ResumeRequiredModal
        open={showResumeRequired}
        onClose={() => setShowResumeRequired(false)}
      />
    </div>
  );
}
