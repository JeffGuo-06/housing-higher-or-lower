export default function CardIcon({ className = "card-icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="3" width="14" height="18" rx="2" />
      <line x1="6" y1="11" x2="20" y2="11" />
    </svg>
  )
}
