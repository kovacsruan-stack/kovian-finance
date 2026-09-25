import type { SVGProps } from 'react'

type BrandMarkProps = SVGProps<SVGSVGElement> & {
  showWordmark?: boolean
  productName?: string
}

export default function BrandMark({ showWordmark = true, productName = 'FINANCE', className }: BrandMarkProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5" data-brand="kovian">
      <img src="/kovian-finance-icon.svg" alt="KOVIAN" className={className ?? 'h-10 w-10 shrink-0 rounded-xl object-contain'} />
      {showWordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-[15px] font-extrabold tracking-[0.14em] text-white">KOVIAN</span>
          <span className="mt-1 text-[8px] font-bold tracking-[0.18em] text-[#28D79F]">{productName}</span>
        </span>
      )}
    </span>
  )
}
