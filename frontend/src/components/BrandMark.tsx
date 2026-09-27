import type { SVGProps } from 'react'

type BrandMarkProps = SVGProps<SVGSVGElement> & {
  showWordmark?: boolean
  productName?: string
}

export default function BrandMark({ showWordmark = true, productName = 'FINANCE', className }: BrandMarkProps) {
  const size = className?.includes('h-8') ? 32 : className?.includes('h-9') ? 36 : 40

  return (
    <span className="brand-mark-lockup" data-brand="kovian">
      <img
        src={`${import.meta.env.BASE_URL}kovian-logo.svg`}
        alt="KOVIAN"
        className="brand-mark-image"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="brand-mark-wordmark">
          <span className="brand-mark-name">KOVIAN</span>
          <span className="brand-mark-product">{productName}</span>
        </span>
      )}
    </span>
  )
}
