import { ImageResponse } from 'next/og'
import { decodeStanceCard } from '@/lib/stance-card'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CATEGORY_COLORS: Record<string, string> = {
  philosophy: '#7c5cc5',
  relationships: '#d94535',
  work: '#2da838',
  money: '#b8900e',
  lifestyle: '#3d73d9',
  society: '#c06518',
}

const CATEGORY_LABELS: Record<string, string> = {
  philosophy: 'Philosophy',
  relationships: 'Relationships',
  work: 'Work',
  money: 'Money',
  lifestyle: 'Lifestyle',
  society: 'Society',
}

export default async function OGImage({ params }: { params: { hash: string } }) {
  const entries = await decodeStanceCard(params.hash)

  if (!entries || entries.length === 0) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0e0e0e',
            color: '#f0ede6',
            fontSize: 48,
            fontFamily: 'sans-serif',
          }}
        >
          Stance Machine
        </div>
      ),
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0e0e0e',
          padding: '40px 50px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#f0ede6',
                letterSpacing: '-0.5px',
              }}
            >
              My Stance Card
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(247, 245, 240, 0.4)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              6 hills I will die on
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#c9a033',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            Stance Machine
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '1px',
            background: 'rgba(247, 245, 240, 0.1)',
            marginBottom: '24px',
          }}
        />

        {/* Stances grid — 2 columns */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            flex: 1,
          }}
        >
          {entries.map((entry, i) => {
            const cat = entry.take.category
            const color = CATEGORY_COLORS[cat] || '#999'
            const isAgree = entry.stance === 'agree'
            const statement = entry.take.statement.length > 70
              ? entry.take.statement.slice(0, 67) + '...'
              : entry.take.statement

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  width: '530px',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: 'rgba(247, 245, 240, 0.04)',
                  border: '1px solid rgba(247, 245, 240, 0.06)',
                }}
              >
                {/* Category indicator */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '72px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: '28px',
                      height: '28px',
                      borderRadius: '4px',
                      background: color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', fontSize: 14, color: 'white' }}>
                      {isAgree ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 10,
                      color: 'rgba(247, 245, 240, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                </div>

                {/* Statement */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'white',
                        background: isAgree ? '#2da838' : '#d94535',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {isAgree ? 'AGREE' : 'DISAGREE'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 15,
                      color: 'rgba(247, 245, 240, 0.8)',
                      lineHeight: '1.4',
                    }}
                  >
                    {`\u201C${statement}\u201D`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 11,
              color: 'rgba(247, 245, 240, 0.2)',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            stancemachine.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
