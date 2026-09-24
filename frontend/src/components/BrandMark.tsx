import type { SVGProps } from 'react'

type BrandMarkProps = SVGProps<SVGSVGElement> & {
  showWordmark?: boolean
  productName?: string
}

export default function BrandMark({ showWordmark = true, productName = 'FINANCE', className, ...props }: BrandMarkProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5" data-brand="kovian">
      <svg
        viewBox="0 0 72 72"
        role="img"
        aria-label="KOVIAN"
        className={className ?? 'h-10 w-10 shrink-0'}
        preserveAspectRatio="xMidYMid meet"
        {...props}
      >
        <path d="M14 9h12v20L44 9h15L39 33l21 30H45L27 39l-1 1v23H14V9Z" fill="#E7EDF2" />
        <path d="M36 42h13l-9 12H27l9-12Z" fill="#28D79F" />
      </svg>
      {showWordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-[15px] font-extrabold tracking-[0.16em] text-white">KOVIAN</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-[8px] font-bold tracking-[0.22em] text-[#28D79F]">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border border-[#28D79F]/40 bg-[#28D79F]/10 text-[7px] font-extrabold tracking-normal text-[#28D79F]" aria-hidden="true">F</span>
            {productName}
          </span>
        </span>
      )}
    </span>
  )
}
