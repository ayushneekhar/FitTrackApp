// src/utils/formatters.ts

/**
 * Formats a duration given in total seconds into a string like "X min Y sec" or "Xh Ym".
 * @param totalSeconds - The total duration in seconds.
 * @returns A formatted duration string.
 */
export const formatDuration = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "0 min 0 sec";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`; // Simpler format for longer durations
  } else if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  } else {
    return `${seconds} sec`;
  }
};

/**
 * Formats a timestamp into a relative date string like "Today", "Yesterday", "X days ago", or a specific date.
 * @param timestamp - The timestamp (milliseconds since epoch).
 * @returns A formatted relative date string.
 */
export const formatRelativeDate = (timestamp: number): string => {
  if (isNaN(timestamp)) {
    return "Invalid Date";
  }

  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const inputDateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (inputDateOnly.getTime() === today.getTime()) {
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  } else if (inputDateOnly.getTime() === yesterday.getTime()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  } else {
    // Calculate days difference
    const diffTime = today.getTime() - inputDateOnly.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1 && diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      // Fallback to specific date for older entries
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        // year: 'numeric', // Optional: add year for very old entries
      });
    }
  }
};
