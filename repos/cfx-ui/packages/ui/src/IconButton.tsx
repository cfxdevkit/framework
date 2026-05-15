import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'className' | 'type'
> & {
  children: ReactNode;
  title: string;
};

export function IconButton({ title, children, ...props }: IconButtonProps) {
  return (
    <button className="button icon" type="button" title={title} aria-label={title} {...props}>
      {children}
    </button>
  );
}
