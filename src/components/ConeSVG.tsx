export function ConeSVG({ size = 28 }: { size?: number }) {
    const aspect = 70 / 60
    const height = Math.round(size * aspect)
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 70"
        width={size}
        height={height}
      >
        <polygon points="30,4 8,62 52,62" fill="#E84400" />
        <polygon points="30,4 8,62 52,62" fill="url(#coneGradBtn)" />
        <defs>
          <linearGradient id="coneGradBtn" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'rgba(0,0,0,0.2)' }} />
            <stop offset="40%" style={{ stopColor: 'rgba(255,255,255,0.1)' }} />
            <stop offset="100%" style={{ stopColor: 'rgba(0,0,0,0.15)' }} />
          </linearGradient>
        </defs>
        <polygon points="14,46 46,46 49,54 11,54" fill="white" opacity="0.9" />
        <polygon points="20,28 40,28 43,36 17,36" fill="white" opacity="0.9" />
        <ellipse cx="30" cy="6" rx="4" ry="2.5" fill="#CC3A00" />
      </svg>
    )
  }