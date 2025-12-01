import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function UserAvatar({ name, src, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
