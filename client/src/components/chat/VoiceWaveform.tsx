const DEFAULT_WAVEFORM_LENGTH = 26;

const FALLBACK_WAVEFORM_LEVELS = [
  0, 0, 0, 1, 3, 5, 6, 4, 2, 0, 0, 2, 5, 6, 4, 3, 0,
  0, 1, 4, 6, 5, 2, 0, 0, 0,
];

interface VoiceWaveformProps {
  levels: number[];
  className: string;
  barClassName: "voice-wave-bar" | "voice-recording-bar";
  playedRatio?: number;
}

export const createEmptyWaveformLevels = (length = 36) =>
  Array.from({ length }, () => 0);

export function formatVoiceTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = Math.floor(safeSeconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function compactWaveformLevels(
  levels: number[],
  targetLength = DEFAULT_WAVEFORM_LENGTH,
) {
  if (levels.length <= targetLength) {
    return levels;
  }

  return Array.from({ length: targetLength }, (_, index) => {
    const start = Math.floor((index * levels.length) / targetLength);
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) * levels.length) / targetLength),
    );

    return Math.max(...levels.slice(start, end));
  });
}

export function getFallbackWaveformLevels() {
  return FALLBACK_WAVEFORM_LEVELS;
}

function getLevelClass(level: number, barClassName: string) {
  if (level <= 0.03) {
    return `${barClassName} ${barClassName}-0`;
  }

  const normalized =
    level <= 1 ? Math.ceil(Math.max(0, Math.min(1, level)) * 6) : level;

  return `${barClassName} ${barClassName}-${Math.max(
    1,
    Math.min(6, normalized),
  )}`;
}

export default function VoiceWaveform({
  levels,
  className,
  barClassName,
  playedRatio = 0,
}: VoiceWaveformProps) {
  return (
    <div className={className} aria-hidden="true">
      {levels.map((level, index) => (
        <span
          key={`${index}:${level}`}
          className={`${getLevelClass(level, barClassName)} ${
            index / levels.length <= playedRatio ? "voice-wave-bar-played" : ""
          }`}
        />
      ))}
    </div>
  );
}
