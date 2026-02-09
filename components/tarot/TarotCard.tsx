import { StanceCategory } from '@/lib/categories'
import TarotIllustration from './TarotIllustration'
import TarotCardBack from './TarotCardBack'

interface TarotCardProps {
  category: StanceCategory
  categoryIndex: number
  totalCards: number
  opinions: Array<{
    statement: string
    stance: 'agree' | 'disagree'
  }>
  isFlipped?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  imageUrl?: string
}

export default function TarotCard({
  category,
  categoryIndex,
  totalCards,
  opinions,
  isFlipped = false,
  onClick,
  size = 'md',
  imageUrl,
}: TarotCardProps) {
  const sizeClasses = {
    sm: 'w-36 sm:w-40',
    md: 'w-52 sm:w-60',
    lg: 'w-72 sm:w-80',
  }

  return (
    <div
      className={`tarot-card-container ${sizeClasses[size]} aspect-[2/3] cursor-pointer`}
      style={{ perspective: '1000px' }}
      onClick={onClick}
    >
      <div
        className={`tarot-card-inner relative w-full h-full transition-transform duration-500`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
        }}
      >
        {/* Front face */}
        <div
          className="tarot-card-face absolute inset-0 flex flex-col overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: '#0E0E0E',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* Double-line frame */}
          <div
            className="absolute inset-[6px] pointer-events-none z-10"
            style={{ border: '1px solid rgba(247, 245, 240, 0.08)', borderRadius: 'var(--radius-sm)' }}
          />
          <div
            className="absolute inset-[10px] pointer-events-none z-10"
            style={{ border: '1px solid rgba(247, 245, 240, 0.04)', borderRadius: 'var(--radius-sm)' }}
          />

          {/* Corner ornaments */}
          <div className="absolute top-2 left-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>
          <div className="absolute top-2 right-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>
          <div className="absolute bottom-2 left-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>
          <div className="absolute bottom-2 right-3 z-10 text-[8px] opacity-30" style={{ color: '#F7F5F0' }}>◆</div>

          {/* Roman numeral header */}
          <div className="flex justify-between items-center px-5 pt-4 pb-1 relative z-10">
            <span className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(247, 245, 240, 0.5)' }}>
              {category.romanNumeral}
            </span>
            <span className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(247, 245, 240, 0.5)' }}>
              {category.romanNumeral}/{toRoman(totalCards)}
            </span>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex items-center justify-center px-6 py-2 relative z-10" style={{ color: category.color }}>
            <TarotIllustration
              category={category.name}
              className="w-full max-w-[65%]"
              imageUrl={imageUrl}
            />
          </div>

          {/* Category name & archetype */}
          <div className="px-5 pb-2 relative z-10">
            <h3
              className="font-display text-sm font-bold tracking-tight"
              style={{ color: category.color }}
            >
              {category.label.toUpperCase()}
            </h3>
            <p
              className="font-mono text-[9px] uppercase tracking-[0.15em] mt-0.5"
              style={{ color: 'rgba(247, 245, 240, 0.4)' }}
            >
              {category.archetype}
            </p>
          </div>

          {/* Opinions */}
          <div className="px-5 pb-3 space-y-1.5 relative z-10">
            {opinions.map((opinion, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2"
                style={{
                  background: 'rgba(247, 245, 240, 0.04)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span
                  className="font-mono text-[9px] font-bold mt-px px-1.5 py-0.5 shrink-0"
                  style={{
                    borderRadius: '2px',
                    background: opinion.stance === 'agree' ? 'var(--agree)' : 'var(--disagree)',
                    color: 'white',
                  }}
                >
                  {opinion.stance === 'agree' ? 'YES' : 'NO'}
                </span>
                <p
                  className="text-[11px] leading-snug line-clamp-3"
                  style={{ color: 'rgba(247, 245, 240, 0.85)' }}
                >
                  &ldquo;{opinion.statement}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Branding footer */}
          <div className="px-5 pb-3 pt-1 mt-auto relative z-10">
            <p
              className="font-mono text-[8px] uppercase tracking-[0.2em] text-center"
              style={{ color: 'rgba(247, 245, 240, 0.25)' }}
            >
              · · · Stance Machine · · ·
            </p>
          </div>
        </div>

        {/* Back face */}
        <div
          className="tarot-card-face absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <TarotCardBack />
        </div>
      </div>
    </div>
  )
}

function toRoman(n: number): string {
  const numerals: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let result = ''
  let remaining = n
  for (const [value, numeral] of numerals) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }
  return result
}
