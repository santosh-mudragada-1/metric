interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-150
        ${checked ? 'border-invert bg-invert' : 'border-border-strong bg-surface-raised hover:border-text-muted'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full shadow-sm transition-transform duration-150
          ${checked ? 'translate-x-5 bg-on-invert' : 'translate-x-0 bg-text-muted'}`}
      />
    </button>
  )
}
