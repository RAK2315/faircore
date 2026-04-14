interface MarqueeProps {
  items: string[]
  speed?: string
  reverse?: boolean
  className?: string
}

export function Marquee({ items, speed = '40s', reverse = false, className = '' }: MarqueeProps) {
  const doubled = [...items, ...items]

  return (
    <div className={`overflow-hidden border-y-4 border-fc-white bg-fc-black py-4 ${className}`}>
      <div
        className="flex w-max whitespace-nowrap"
        style={{
          animation: `marquee ${speed} linear infinite ${reverse ? 'reverse' : ''}`,
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="font-headline font-black text-xs uppercase tracking-[0.3em] text-fc-muted px-8">
              {item}
            </span>
            <span className="text-fc-yellow font-black">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
