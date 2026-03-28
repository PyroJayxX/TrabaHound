import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ResumePayload = {
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

type CrawledJob = {
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

function normalizeJobs(input: unknown): CrawledJob[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item) => typeof item === "object" && item !== null)
    .map((item, index) => {
      const job = item as Partial<CrawledJob>;
      return {
        id: typeof job.id === "string" && job.id.trim() ? job.id : `job-${index}`,
        title: typeof job.title === "string" ? job.title : "",
        company: typeof job.company === "string" ? job.company : "",
        location: typeof job.location === "string" ? job.location : "",
        mode:
          job.mode === "remote" || job.mode === "hybrid" || job.mode === "onsite"
            ? job.mode
            : "onsite",
        platform:
          job.platform === "Indeed" ||
          job.platform === "LinkedIn"
            ? job.platform
            : "Indeed",
        url: typeof job.url === "string" ? job.url : "",
        description: typeof job.description === "string" ? job.description : "",
        matchedSkills: Array.isArray(job.matchedSkills)
          ? job.matchedSkills.filter((skill): skill is string => typeof skill === "string")
          : [],
      };
    })
    .filter((job) => Boolean(job.title && job.url));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ResumePayload;
    const skills = Array.isArray(payload.skills)
      ? payload.skills.filter((skill) => typeof skill === "string" && skill.trim().length > 0)
      : [];

    if (skills.length === 0) {
      return NextResponse.json(
        { error: "At least one skill is required to crawl jobs." },
        { status: 400 },
      );
    }

    const response = await fetch("http://localhost:8000/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        skills,
        experience: Array.isArray(payload.experience) ? payload.experience : [],
        education: Array.isArray(payload.education) ? payload.education : [],
        certifications: Array.isArray(payload.certifications) ? payload.certifications : [],
      }),
      cache: "no-store",
    });

    const raw = await response.text();
    let data: unknown = [];

    try {
      data = JSON.parse(raw);
    } catch {
      data = [];
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "detail" in data &&
        typeof (data as { detail?: unknown }).detail === "string"
          ? (data as { detail: string }).detail
          : "Crawler service failed.";

      return NextResponse.json({ error: message }, { status: response.status });
    }

    const jobs = normalizeJobs(data);
    return NextResponse.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to crawl jobs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
