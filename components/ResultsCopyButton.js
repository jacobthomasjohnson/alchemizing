import { useState } from "react";
import copyToClipboard from "@/utils/clipboard";

export default function ResultsCopyButton({ textToCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(textToCopy);
      setCopied(true);
      // after 2s, revert the label
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // optionally show an error toast here
      console.error("Failed to copy");
    }
  };

  return (
    <div className="inline-block rounded-lg p-[1px] bg-gradient-to-tr from-[#f0d1ff] to-[#80c7bf] w-full">
      <button
        onClick={handleCopy}
        className="px-4 py-4 w-full rounded-lg bg-background text-xs text-neutral-300 hover:font-bold transition-all duration-100"
      >
        {copied ? "Results Copied!" : "Copy Results"}
      </button>
    </div>
  );
}
