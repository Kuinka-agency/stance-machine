import { CATEGORIES, type StanceEntry } from '@/lib/categories'
import TarotCard from './TarotCard'

interface TarotSpreadProps {
  entries: StanceEntry[]
  onCardClick?: (index: number) => void
  animated?: boolean
  flippedCards?: boolean[]
}

const rotations = [-2, 1.5, -1, 2, -1.5, 1]

export default function TarotSpread({
  entries,
  onCardClick,
  animated = true,
  flippedCards,
}: TarotSpreadProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 justify-items-center max-w-2xl mx-auto px-2">
      {entries.map((entry, i) => {
        const category = CATEGORIES.find(c => c.name === entry.take.category) || CATEGORIES[i]
        const isFlipped = flippedCards ? flippedCards[i] : !animated

        return (
          <div
            key={entry.take.id}
            className={animated ? 'tarot-spread-card' : ''}
            style={{
              transform: `rotate(${rotations[i]}deg)`,
              animationDelay: animated ? `${i * 200}ms` : undefined,
            }}
          >
            <TarotCard
              category={category}
              categoryIndex={i}
              totalCards={entries.length}
              opinions={[{
                statement: entry.take.statement,
                stance: entry.stance as 'agree' | 'disagree',
              }]}
              isFlipped={isFlipped}
              onClick={() => onCardClick?.(i)}
              size="sm"
            />
          </div>
        )
      })}
    </div>
  )
}
