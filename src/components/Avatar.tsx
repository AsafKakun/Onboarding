import { getInitials } from '../utils/initials';

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {getInitials(name)}
    </span>
  );
}
