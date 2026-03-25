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
};

type JobCardProps = {
  job: Job;
  onClick?: () => void;
  isSaved?: boolean;
};

export default function JobCard({ job, onClick, isSaved = false }: JobCardProps) {
  return (
    <article className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#e8ff47]/40 hover:bg-white/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{job.title}</h3>
          <p className="text-sm text-zinc-400">
            {job.company} • {job.location} • {job.mode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="rounded border border-[#e8ff47]/30 bg-[#e8ff47]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#e8ff47]">
              Saved
            </span>
          )}
          <span className="rounded border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-xs font-medium text-cyan-200">
            {job.match}% match
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded border border-indigo-300/30 bg-indigo-300/10 px-2 py-0.5 text-xs font-medium text-indigo-200">
          Site: {job.source}
        </span>
        {job.skills.map((skill) => (
          <span
            key={skill}
            className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-300"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {onClick && (
          <button
            type="button"
            onClick={onClick}
            className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-300/20"
          >
            Open Skill Gap
          </button>
        )}
        <a
          href={job.postingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-[#e8ff47]/35 bg-[#e8ff47]/15 px-3 py-1.5 text-xs font-semibold text-[#f3ff9e] hover:bg-[#e8ff47]/25"
        >
          Go to Posting
        </a>
      </div>
    </article>
  );
}
