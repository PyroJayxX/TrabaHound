"use client";

import { useMemo, useRef, useState } from "react";
import Sidebar from "@/app/components/sidebar";
import ResumeRequiredModal from "@/app/components/resume-required-modal";
import JobDashboard from "@/app/components/job-dashboard";

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

type DonutMetric = {
  label: string;
  value: number;
  color: string;
  subtitle: string;
};

type ParsedResumeApi = {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  certifications: string[];
};

type ResumeDataForJobs = {
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  certifications: string[];
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
  const [crawlerStatus, setCrawlerStatus] = useState<"idle" | "crawling" | "ready" | "error">("idle");
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [newSkill, setNewSkill] = useState("");
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [resumeDataForJobs, setResumeDataForJobs] = useState<ResumeDataForJobs>({
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  });
  const resumeInputRef = useRef<HTMLInputElement>(null);

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
      setResumeDataForJobs({ skills: [], experience: [], education: [], certifications: [] });
      setCrawlerStatus("idle");
      setIsEditingProfile(true);
      setUploadError("");
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
    setUploadError("");
    setCrawlerStatus("idle");
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
    setResumeDataForJobs({
      skills: ["Python", "SQL", "Tableau", "Excel"],
      experience: [
        {
          company: "Acme Analytics",
          role: "Data Analyst",
          duration: "2 years",
          description: "Built dashboards and automated reporting pipelines.",
        },
      ],
      education: [
        {
          institution: "Metro University",
          degree: "BS Information Systems",
          year: "2022",
        },
      ],
      certifications: ["Google Data Analytics"],
    });
  };

  const openResumePicker = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf") && !fileName.endsWith(".docx")) {
      setUploadError("Please upload a PDF or DOCX resume.");
      event.target.value = "";
      return;
    }

    setIsParsingResume(true);
    setUploadError("");
    setCrawlerStatus("idle");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const rawBody = await response.text();
      const payload = (() => {
        try {
          return JSON.parse(rawBody) as ParsedResumeApi | { error?: string };
        } catch {
          return null;
        }
      })();

      if (!response.ok) {
        const message =
          payload && "error" in payload && payload.error
            ? payload.error
            : rawBody.includes("<!DOCTYPE")
              ? "Server returned HTML instead of JSON. Check your API route and server logs."
              : "Failed to parse resume.";
        throw new Error(message);
      }

      if (!payload) {
        throw new Error("Server response was not valid JSON.");
      }

      const parsed = payload as ParsedResumeApi;

      setResumeDataForJobs({
        skills: parsed.skills,
        experience: parsed.experience,
        education: parsed.education,
        certifications: parsed.certifications,
      });

      const flattenedEducation = parsed.education
        .map((item) => [item.degree, item.institution, item.year ? `(${item.year})` : ""]
          .filter(Boolean)
          .join(" "))
        .join("; ");

      const flattenedExperience = parsed.experience
        .map((item) =>
          [
            item.role,
            item.company ? `at ${item.company}` : "",
            item.duration ? `(${item.duration})` : "",
            item.description,
          ]
            .filter(Boolean)
            .join(" "),
        )
        .join("; ");

      setProfile((prev) => ({
        ...prev,
        fullName: parsed.name || prev.fullName,
        contact: parsed.phone || prev.contact,
        email: parsed.email || prev.email,
        education: flattenedEducation || prev.education,
        certifications: parsed.certifications.join(", ") || prev.certifications,
        experience: flattenedExperience || prev.experience,
        skills: parsed.skills.length > 0 ? parsed.skills : prev.skills,
      }));

      setHasResume(true);
      setIsEditingProfile(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload resume.");
    } finally {
      setIsParsingResume(false);
      event.target.value = "";
    }
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
      <Sidebar active={active} onNavigate={handleNavigate} crawlerStatus={crawlerStatus} />

      <main className="flex flex-1 flex-col overflow-auto">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.07] px-6 sm:px-8">
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleResumeFileSelected}
            className="hidden"
          />
          <h1 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            {active}
          </h1>
          <div className="flex items-center gap-3">
            <span className="rounded border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
              {hasResume ? "Resume loaded" : "Upload resume to unlock"}
            </span>
            <button
              type="button"
              onClick={openResumePicker}
              disabled={isParsingResume}
              className="h-8 rounded bg-[#e8ff47] px-4 text-xs font-semibold text-black transition-opacity hover:opacity-90"
            >
              {isParsingResume ? "Parsing..." : "Upload Resume"}
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
                  {uploadError && <p className="mt-2 text-sm text-rose-300">{uploadError}</p>}
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
                      onClick={openResumePicker}
                      disabled={isParsingResume}
                      className="rounded bg-[#e8ff47] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {isParsingResume ? "Uploading..." : "Upload Resume File"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={uploadMockResume}
                    className="rounded border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.08]"
                  >
                    Use Mock Resume
                  </button>
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
            <JobDashboard resumeData={resumeDataForJobs} onStatusChange={setCrawlerStatus} />
          )}

          {active === "Saved Jobs" && (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <h2 className="text-xl font-semibold text-white">Saved Jobs</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Saved jobs persistence is not wired yet. Use Dashboard for live backend data.
              </p>
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
