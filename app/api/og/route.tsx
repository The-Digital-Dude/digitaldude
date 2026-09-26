import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'The Digital Dude';
    const tag = searchParams.get('tag') || 'Software Engineering & Technical Growth';
    const category = searchParams.get('category') || 'Production Systems';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A', // Slate 900 / dark navy
            padding: '60px 80px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle glowing radial background */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
            }}
          />

          {/* Top Brand Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#7C3AED', // Purple
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '22px',
                }}
              >
                DD
              </div>
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize: '26px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                }}
              >
                The Digital Dude
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                color: '#C4B5FD',
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {category}
            </div>
          </div>

          {/* Main Title & Tag */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              maxWidth: '1040px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontSize: '52px',
                fontWeight: 800,
                color: '#F8FAFC',
                lineHeight: 1.15,
                letterSpacing: '-1.5px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#94A3B8',
                lineHeight: 1.4,
                fontWeight: 400,
              }}
            >
              {tag}
            </div>
          </div>

          {/* Footer Metadata */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(148, 163, 184, 0.15)',
              paddingTop: '24px',
              width: '100%',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ color: '#E2E8F0', fontSize: '18px', fontWeight: 600 }}>
                digitaldude.co.uk
              </span>
              <span style={{ color: '#64748B', fontSize: '18px' }}>•</span>
              <span style={{ color: '#94A3B8', fontSize: '18px' }}>
                Bespoke CRMs, SaaS &amp; Marketplaces
              </span>
            </div>

            <span
              style={{
                color: '#A78BFA',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              UK &amp; Australia
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const err = e as Error;
    return new Response(`Failed to generate the image: ${err.message}`, {
      status: 500,
    });
  }
}
