import type { CatMood } from '../types'

export type CatPhase = 'idle' | 'eating' | 'grooming' | 'petting'

interface CatProps {
  mood: CatMood
  phase?: CatPhase
  /** Pupil offset in the -1..1 range, used while chasing the feather. */
  lookAt?: { x: number; y: number } | null
  size?: number
}

const EYES = [
  { cx: 133, cy: 134 },
  { cx: 187, cy: 134 },
]

export function Cat({ mood, phase = 'idle', lookAt = null, size }: CatProps) {
  const asleep = mood === 'sleeping'
  const dilated = mood === 'happy' || phase === 'petting' || lookAt !== null
  const pupilRx = dilated ? 8.5 : 6
  const gazeX = lookAt ? Math.max(-1, Math.min(1, lookAt.x)) * 5 : 0
  const gazeY = lookAt ? Math.max(-1, Math.min(1, lookAt.y)) * 4 : 0

  return (
    <svg
      className={`cat cat--${mood} cat--${phase}`}
      viewBox="0 0 320 300"
      width={size}
      height={size ? (size * 300) / 320 : undefined}
      role="img"
      aria-label={`Cat looking ${mood}`}
    >
      <defs>
        <radialGradient id="catFurBody" cx="46%" cy="26%" r="80%">
          <stop offset="0%" stopColor="#FCE3C8" />
          <stop offset="58%" stopColor="#F3C79E" />
          <stop offset="100%" stopColor="#DBA073" />
        </radialGradient>
        <radialGradient id="catFurHead" cx="40%" cy="24%" r="82%">
          <stop offset="0%" stopColor="#FDEBD8" />
          <stop offset="52%" stopColor="#F6CFA9" />
          <stop offset="100%" stopColor="#DDA277" />
        </radialGradient>
        <linearGradient id="catInnerEar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFCAD6" />
          <stop offset="100%" stopColor="#EF8F9E" />
        </linearGradient>
        <radialGradient id="catIris" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#CBF2E2" />
          <stop offset="42%" stopColor="#63C4A6" />
          <stop offset="100%" stopColor="#1F6E5D" />
        </radialGradient>
        <radialGradient id="catFloor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#241C1A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#241C1A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="284" rx="102" ry="16" fill="url(#catFloor)" />

      <g className="cat__tail">
        <path
          d="M222 250C276 254 296 212 272 184"
          stroke="#E3AC80"
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M272 184C265 176 255 180 255 190"
          stroke="#FBE0C4"
          strokeWidth="21"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M246 252h2M266 238l2 3M280 214v3"
          stroke="#CE8F62"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>

      <g className="cat__breathe">
        <ellipse cx="160" cy="224" rx="82" ry="58" fill="url(#catFurBody)" />

        <path
          d="M94 204q16 12 8 28M106 246q14 6 12 20"
          stroke="#D49468"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />

        <ellipse cx="160" cy="240" rx="52" ry="38" fill="#FFF3E6" opacity="0.92" />

        <g className="cat__paws">
          <ellipse cx="126" cy="272" rx="26" ry="15" fill="#FFF6EC" />
          <ellipse cx="194" cy="272" rx="26" ry="15" fill="#FFF6EC" />
          <path
            d="M118 268v6M126 266v8M134 268v6M186 268v6M194 266v8M202 268v6"
            stroke="#EAC5A5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        <g className="cat__head">
          <g className="cat__ear cat__ear--left">
            <path
              d="M106 110L115 28L174 86Z"
              fill="url(#catFurHead)"
              stroke="url(#catFurHead)"
              strokeWidth="11"
              strokeLinejoin="round"
            />
            <path
              d="M119 102L124 50L156 84Z"
              fill="url(#catInnerEar)"
              stroke="url(#catInnerEar)"
              strokeWidth="6"
              strokeLinejoin="round"
            />
          </g>
          <g className="cat__ear cat__ear--right">
            <path
              d="M214 110L205 28L146 86Z"
              fill="url(#catFurHead)"
              stroke="url(#catFurHead)"
              strokeWidth="11"
              strokeLinejoin="round"
            />
            <path
              d="M201 102L196 50L164 84Z"
              fill="url(#catInnerEar)"
              stroke="url(#catInnerEar)"
              strokeWidth="6"
              strokeLinejoin="round"
            />
          </g>

          <ellipse cx="102" cy="150" rx="19" ry="16" fill="#F2C69F" />
          <ellipse cx="218" cy="150" rx="19" ry="16" fill="#F2C69F" />
          <ellipse cx="160" cy="130" rx="64" ry="56" fill="url(#catFurHead)" />
          <ellipse
            cx="160"
            cy="174"
            rx="44"
            ry="14"
            fill="#E7B78E"
            opacity="0.3"
          />

          <path
            d="M160 78v15M138 84l6 13M182 84l-6 13"
            stroke="#D89A6E"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.7"
          />

          <ellipse cx="114" cy="160" rx="14" ry="9" fill="#F59AA9" opacity="0.35" />
          <ellipse cx="206" cy="160" rx="14" ry="9" fill="#F59AA9" opacity="0.35" />

          {asleep ? (
            <g>
              <path
                d="M116 134q17 15 34 0"
                stroke="#A9714B"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M170 134q17 15 34 0"
                stroke="#A9714B"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : (
            <g className="cat__eyes">
              {EYES.map((eye) => (
                <g key={eye.cx}>
                  <ellipse
                    cx={eye.cx}
                    cy={eye.cy}
                    rx="17.5"
                    ry="19.5"
                    fill="url(#catIris)"
                    stroke="#2C6A5C"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx={eye.cx + gazeX}
                    cy={eye.cy + gazeY}
                    rx={pupilRx}
                    ry="14"
                    fill="#16241F"
                  />
                  <circle
                    cx={eye.cx - 6 + gazeX}
                    cy={eye.cy - 8 + gazeY}
                    r="5.4"
                    fill="#FFFFFF"
                    opacity="0.92"
                  />
                  <circle
                    cx={eye.cx + 7 + gazeX}
                    cy={eye.cy + 8 + gazeY}
                    r="2.6"
                    fill="#FFFFFF"
                    opacity="0.5"
                  />
                  <ellipse
                    className="cat__lid"
                    cx={eye.cx}
                    cy={eye.cy}
                    rx="19"
                    ry="20.5"
                    fill="url(#catFurHead)"
                  />
                </g>
              ))}
            </g>
          )}

          <ellipse cx="143" cy="178" rx="17" ry="11" fill="#FFF4E8" opacity="0.92" />
          <ellipse cx="177" cy="178" rx="17" ry="11" fill="#FFF4E8" opacity="0.92" />

          <path
            d="M151 157q9-3 18 0 1 7-9 13-10-6-9-13z"
            fill="#F0919F"
            stroke="#DE7A8B"
            strokeWidth="1.5"
          />
          <path
            d="M160 170v5"
            stroke="#B0765A"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M160 175q-10 9-18 1M160 175q10 9 18 1"
            stroke="#B0765A"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          <g stroke="#C89A79" strokeWidth="2.4" strokeLinecap="round" opacity="0.8">
            <path d="M126 164Q106 158 90 154" fill="none" />
            <path d="M126 172Q104 172 88 173" fill="none" />
            <path d="M126 180Q106 185 92 189" fill="none" />
            <path d="M194 164Q214 158 230 154" fill="none" />
            <path d="M194 172Q216 172 232 173" fill="none" />
            <path d="M194 180Q214 185 228 189" fill="none" />
          </g>

          <path
            d="M110 184Q160 214 210 184"
            stroke="#E85D75"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M160 214c-4.5-3.8-10-8.4-10-13.4 0-3.2 2.7-5.3 5.5-5.3 1.9 0 3.6.9 4.5 2.3.9-1.4 2.6-2.3 4.5-2.3 2.8 0 5.5 2.1 5.5 5.3 0 5-5.5 9.6-10 13.4z"
            fill="#F6C453"
            stroke="#E0A93B"
            strokeWidth="1.2"
          />
        </g>
      </g>

      {phase === 'eating' ? (
        <g className="cat__bowl">
          <ellipse cx="160" cy="292" rx="36" ry="8" fill="#C44569" opacity="0.2" />
          <path d="M126 274h68l-9 16h-50z" fill="#E85D75" />
          <ellipse cx="160" cy="274" rx="34" ry="9" fill="#FFD9E0" />
          <ellipse cx="160" cy="273" rx="25" ry="6" fill="#C98F5F" />
        </g>
      ) : null}

      {phase === 'grooming' ? (
        <g className="cat__sparkles" fill="#FFD166">
          <path className="cat__sparkle" d="M92 96l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
          <path className="cat__sparkle" d="M232 116l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
          <path className="cat__sparkle" d="M212 48l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        </g>
      ) : null}

      {asleep ? (
        <g className="cat__zzz" fill="#C44569" opacity="0.8">
          <text className="cat__z cat__z--1" x="232" y="92" fontSize="22" fontWeight="700">
            z
          </text>
          <text className="cat__z cat__z--2" x="252" y="66" fontSize="17" fontWeight="700">
            z
          </text>
          <text className="cat__z cat__z--3" x="268" y="44" fontSize="13" fontWeight="700">
            z
          </text>
        </g>
      ) : null}

      {mood === 'hungry' && phase === 'idle' ? (
        <g className="cat__thought">
          <circle cx="252" cy="88" r="20" fill="#FFFFFF" opacity="0.95" />
          <circle cx="228" cy="112" r="7" fill="#FFFFFF" opacity="0.9" />
          <circle cx="216" cy="126" r="4" fill="#FFFFFF" opacity="0.85" />
          <path d="M241 86h22l-4 9h-14z" fill="#E85D75" />
          <ellipse cx="252" cy="86" rx="11" ry="3.4" fill="#FFD9E0" />
        </g>
      ) : null}
    </svg>
  )
}
