type ResumeRequiredModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ResumeRequiredModal({
  open,
  onClose,
}: ResumeRequiredModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-rose-300/30 bg-[#151619] p-5 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-300">
          Navigation Blocked
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Please upload resume first.</h2>
        <p className="mt-2 text-sm text-zinc-400">
          You need to upload your resume in the Profile screen before opening the
          other screens.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#e8ff47] px-3 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
