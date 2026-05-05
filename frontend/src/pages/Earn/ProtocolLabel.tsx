import type { ReactNode } from 'react'
import { PROTOCOL_LABELS } from './labels'

const AaveIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g clipPath="url(#clip0_8208_25954)">
      <path
        d="M12.0004 23.6404C18.4289 23.6404 23.6404 18.4289 23.6404 12.0004C23.6404 5.57176 18.4289 0.360352 12.0004 0.360352C5.57176 0.360352 0.360352 5.57176 0.360352 12.0004C0.360352 18.4289 5.57176 23.6404 12.0004 23.6404Z"
        fill="url(#paint0_linear_8208_25954)"
      />
      <path
        d="M17.0948 16.6386L13.1588 7.12262C12.9368 6.63062 12.6068 6.39062 12.1718 6.39062H11.8238C11.3888 6.39062 11.0588 6.63062 10.8368 7.12262L9.12382 11.2686H7.82782C7.44082 11.2716 7.12582 11.5836 7.12282 11.9736V11.9826C7.12582 12.3696 7.44082 12.6846 7.82782 12.6876H8.52382L6.88882 16.6386C6.85882 16.7256 6.84082 16.8156 6.84082 16.9086C6.84082 17.1306 6.90982 17.3046 7.03282 17.4396C7.15582 17.5746 7.33282 17.6406 7.55482 17.6406C7.70182 17.6376 7.84282 17.5926 7.95982 17.5056C8.08582 17.4186 8.17282 17.2926 8.24182 17.1486L10.0418 12.6846H11.2898C11.6768 12.6816 11.9918 12.3696 11.9948 11.9796V11.9616C11.9918 11.5746 11.6768 11.2596 11.2898 11.2566H10.6238L11.9978 7.83363L15.7418 17.1456C15.8108 17.2896 15.8978 17.4156 16.0238 17.5026C16.1408 17.5896 16.2848 17.6346 16.4288 17.6376C16.6508 17.6376 16.8248 17.5716 16.9508 17.4366C17.0768 17.3016 17.1428 17.1276 17.1428 16.9056C17.1458 16.8156 17.1308 16.7226 17.0948 16.6386Z"
        fill="white"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_8208_25954"
        x1="20.679"
        y1="4.69794"
        x2="3.35865"
        y2="19.2712"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#B6509E" />
        <stop offset="1" stopColor="#2EBAC6" />
      </linearGradient>
      <clipPath id="clip0_8208_25954">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const PROTOCOL_ICONS: Record<string, (props: { size?: number }) => ReactNode> = {
  'aave-v3': AaveIcon,
}

export const ProtocolLabel = ({ strategy, iconSize }: { strategy: string; iconSize?: number }) => {
  const Icon = PROTOCOL_ICONS[strategy]
  const label = PROTOCOL_LABELS[strategy] ?? strategy
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon size={iconSize} />}
      {label}
    </span>
  )
}
