/**
 * Generate a consistent color from a string (e.g., username)
 * Uses a hash function to ensure the same string always produces the same color
 */
export function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Extract initials from a name (e.g., "John Doe" -> "JD")
 * Handles single names, multiple names, and edge cases
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
