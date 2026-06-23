/**
 * Generates a consistent, premium gradient background based on the hash of a string.
 */
export const stringToGradient = (string) => {
  if (!string) return 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', // Violet-pink
    'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', // Blue-violet
    'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', // Emerald-blue
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', // Amber-red
    'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', // Indigo-purple
    'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)'  // Pink-rose
  ];
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

/**
 * Returns the properties required to render a premium letter-based MUI Avatar.
 */
export const getAvatarProps = (name, customSx = {}) => {
  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : '?';
  return {
    children: firstLetter,
    sx: {
      background: stringToGradient(name),
      color: '#fff',
      fontWeight: 700,
      ...customSx
    }
  };
};
