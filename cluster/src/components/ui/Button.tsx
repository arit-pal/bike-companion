import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const base = 'inline-flex items-center justify-center rounded font-semibold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none'
const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-fixed',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  outline: 'border border-surface-container-highest bg-transparent text-on-surface hover:bg-surface-container',
}
const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-label-md',
  md: 'h-10 px-4 text-label-md',
  lg: 'h-11 px-6 text-headline-sm',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()} {...props} />
}
