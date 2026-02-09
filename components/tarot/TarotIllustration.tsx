interface TarotIllustrationProps {
  category: string
  className?: string
  imageUrl?: string
}

function PhilosophySVG() {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Eye within triangle, radiating lines */}
      <polygon points="100,30 170,150 30,150" />
      <circle cx="100" cy="110" r="20" />
      <circle cx="100" cy="110" r="8" fill="currentColor" stroke="none" />
      {/* Radiating lines from top */}
      <line x1="100" y1="10" x2="100" y2="25" />
      <line x1="80" y1="15" x2="88" y2="28" />
      <line x1="120" y1="15" x2="112" y2="28" />
      <line x1="65" y1="25" x2="78" y2="35" />
      <line x1="135" y1="25" x2="122" y2="35" />
      {/* Geometric accents */}
      <line x1="50" y1="160" x2="30" y2="175" />
      <line x1="150" y1="160" x2="170" y2="175" />
      <line x1="100" y1="155" x2="100" y2="175" />
      {/* Inner triangle */}
      <polygon points="100,55 140,140 60,140" opacity="0.3" />
    </svg>
  )
}

function RelationshipsSVG() {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Vesica piscis — two overlapping circles */}
      <circle cx="80" cy="100" r="50" />
      <circle cx="120" cy="100" r="50" />
      {/* Rays from intersection */}
      <line x1="100" y1="40" x2="100" y2="15" />
      <line x1="100" y1="160" x2="100" y2="185" />
      <line x1="85" y1="45" x2="78" y2="22" />
      <line x1="115" y1="45" x2="122" y2="22" />
      <line x1="85" y1="155" x2="78" y2="178" />
      <line x1="115" y1="155" x2="122" y2="178" />
      {/* Central diamond in overlap */}
      <polygon points="100,65 110,100 100,135 90,100" fill="currentColor" opacity="0.15" stroke="currentColor" />
      {/* Dot accents */}
      <circle cx="100" cy="100" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WorkSVG() {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Geometric tower/column ascending */}
      <rect x="75" y="50" width="50" height="130" />
      <rect x="85" y="60" width="30" height="25" opacity="0.3" />
      <rect x="85" y="95" width="30" height="25" opacity="0.3" />
      <rect x="85" y="130" width="30" height="25" opacity="0.3" />
      {/* Grid lines behind */}
      <line x1="40" y1="180" x2="160" y2="180" />
      <line x1="50" y1="170" x2="150" y2="170" opacity="0.4" />
      <line x1="60" y1="160" x2="140" y2="160" opacity="0.2" />
      {/* Ascending element — triangle cap */}
      <polygon points="100,20 125,50 75,50" />
      {/* Side supports */}
      <line x1="75" y1="180" x2="55" y2="180" />
      <line x1="125" y1="180" x2="145" y2="180" />
      <line x1="55" y1="180" x2="75" y2="140" opacity="0.4" />
      <line x1="145" y1="180" x2="125" y2="140" opacity="0.4" />
      {/* Top accent */}
      <circle cx="100" cy="35" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MoneySVG() {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Compass rose / wheel */}
      <circle cx="100" cy="100" r="60" />
      <circle cx="100" cy="100" r="45" opacity="0.4" />
      <circle cx="100" cy="100" r="15" />
      {/* Diamond-tipped spokes */}
      <line x1="100" y1="25" x2="100" y2="175" />
      <line x1="25" y1="100" x2="175" y2="100" />
      <line x1="58" y1="58" x2="142" y2="142" opacity="0.5" />
      <line x1="142" y1="58" x2="58" y2="142" opacity="0.5" />
      {/* Diamond tips */}
      <polygon points="100,20 105,30 100,40 95,30" fill="currentColor" stroke="none" />
      <polygon points="100,160 105,170 100,180 95,170" fill="currentColor" stroke="none" />
      <polygon points="20,100 30,95 40,100 30,105" fill="currentColor" stroke="none" />
      <polygon points="160,100 170,95 180,100 170,105" fill="currentColor" stroke="none" />
      {/* Center coin */}
      <circle cx="100" cy="100" r="5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LifestyleSVG() {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Star with radiating lines above horizon */}
      {/* Main star */}
      <polygon points="100,25 108,55 140,55 114,72 124,105 100,85 76,105 86,72 60,55 92,55" />
      <circle cx="100" cy="65" r="5" fill="currentColor" stroke="none" />
      {/* Radiating lines */}
      <line x1="100" y1="10" x2="100" y2="20" />
      <line x1="75" y1="18" x2="82" y2="27" />
      <line x1="125" y1="18" x2="118" y2="27" />
      <line x1="55" y1="35" x2="63" y2="42" />
      <line x1="145" y1="35" x2="137" y2="42" />
      {/* Horizon path */}
      <line x1="20" y1="140" x2="180" y2="140" />
      <line x1="30" y1="150" x2="170" y2="150" opacity="0.4" />
      {/* Path leading to star */}
      <line x1="80" y1="140" x2="95" y2="110" opacity="0.5" />
      <line x1="120" y1="140" x2="105" y2="110" opacity="0.5" />
      {/* Ground dots */}
      <circle cx="50" cy="140" r="2" fill="currentColor" stroke="none" />
      <circle cx="150" cy="140" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SocietySVG() {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Balanced scales / twin pillars with arch */}
      {/* Left pillar */}
      <rect x="45" y="60" width="12" height="115" />
      {/* Right pillar */}
      <rect x="143" y="60" width="12" height="115" />
      {/* Arch connecting */}
      <path d="M 51 60 Q 100 15 149 60" />
      <path d="M 57 60 Q 100 25 143 60" opacity="0.3" />
      {/* Base */}
      <line x1="30" y1="175" x2="170" y2="175" />
      <line x1="35" y1="180" x2="165" y2="180" opacity="0.4" />
      {/* Scale beam */}
      <line x1="51" y1="95" x2="149" y2="95" />
      <circle cx="100" cy="95" r="4" fill="currentColor" stroke="none" />
      {/* Scale pans */}
      <path d="M 40 110 Q 51 120 62 110" />
      <line x1="51" y1="95" x2="40" y2="110" opacity="0.5" />
      <line x1="51" y1="95" x2="62" y2="110" opacity="0.5" />
      <path d="M 138 110 Q 149 120 160 110" />
      <line x1="149" y1="95" x2="138" y2="110" opacity="0.5" />
      <line x1="149" y1="95" x2="160" y2="110" opacity="0.5" />
      {/* Keystone */}
      <polygon points="100,22 106,32 94,32" fill="currentColor" stroke="none" />
    </svg>
  )
}

const illustrations: Record<string, () => JSX.Element> = {
  philosophy: PhilosophySVG,
  relationships: RelationshipsSVG,
  work: WorkSVG,
  money: MoneySVG,
  lifestyle: LifestyleSVG,
  society: SocietySVG,
}

export default function TarotIllustration({ category, className = '', imageUrl }: TarotIllustrationProps) {
  if (imageUrl) {
    return (
      <div className={`aspect-square overflow-hidden ${className}`}>
        <img src={imageUrl} alt={category} className="w-full h-full object-cover" />
      </div>
    )
  }

  const SVGComponent = illustrations[category]
  if (!SVGComponent) return null

  return (
    <div className={`aspect-square ${className}`}>
      <SVGComponent />
    </div>
  )
}
