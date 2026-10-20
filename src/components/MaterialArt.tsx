import type { Artwork } from "../data/types";

/** Original material studies. Transparent surroundings let the page supply the surface. */
export function MaterialArt({
  kind,
  id,
  accent,
}: {
  kind: Artwork;
  id: string;
  accent: string;
}) {
  const paint = (name: string) => `url(#${id}-${name})`;

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id={`${id}-clear-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#718487" stopOpacity=".19" />
          <stop offset=".045" stopColor="#fff" stopOpacity=".75" />
          <stop offset=".13" stopColor="#dae4e2" stopOpacity=".16" />
          <stop offset=".3" stopColor="#fff" stopOpacity=".035" />
          <stop offset=".72" stopColor="#fff" stopOpacity=".015" />
          <stop offset=".9" stopColor="#91a6a6" stopOpacity=".075" />
          <stop offset=".975" stopColor="#687d7e" stopOpacity=".25" />
          <stop offset="1" stopColor="#fff" stopOpacity=".7" />
        </linearGradient>
        <linearGradient id={`${id}-clear-liquid`} x1="0" y1="0" x2=".22" y2="1">
          <stop offset="0" stopColor="#e3efed" stopOpacity=".33" />
          <stop offset=".55" stopColor="#c8dddc" stopOpacity=".38" />
          <stop offset=".88" stopColor="#a5c3c6" stopOpacity=".5" />
          <stop offset="1" stopColor="#759ba2" stopOpacity=".52" />
        </linearGradient>
        <linearGradient id={`${id}-glass-foot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#627d80" stopOpacity=".4" />
          <stop offset=".35" stopColor="#f8ffff" stopOpacity=".86" />
          <stop offset=".72" stopColor="#a7b9b7" stopOpacity=".26" />
          <stop offset="1" stopColor="#6e8383" stopOpacity=".48" />
        </linearGradient>
        <linearGradient id={`${id}-bottle-body`} x1="0" y1="0" x2="1" y2=".12">
          <stop offset="0" stopColor="#493426" />
          <stop offset=".055" stopColor="#755036" />
          <stop offset=".14" stopColor="#bd925c" />
          <stop offset=".23" stopColor="#9d6c3e" />
          <stop offset=".46" stopColor="#8b5b35" />
          <stop offset=".77" stopColor="#714329" />
          <stop offset=".94" stopColor="#492e22" />
          <stop offset="1" stopColor="#755039" />
        </linearGradient>
        <linearGradient id={`${id}-bottle-fill`} x1="0" y1="0" x2=".15" y2="1">
          <stop offset="0" stopColor="#c18a43" stopOpacity=".16" />
          <stop offset=".72" stopColor="#87552c" stopOpacity=".03" />
          <stop offset="1" stopColor="#36271e" stopOpacity=".56" />
        </linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2=".08">
          <stop offset="0" stopColor="#d4cdbb" />
          <stop offset=".16" stopColor="#f0eadb" />
          <stop offset=".64" stopColor="#e8e1d0" />
          <stop offset="1" stopColor="#beb39a" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2=".12">
          <stop offset="0" stopColor="#282b28" />
          <stop offset=".18" stopColor="#585950" />
          <stop offset=".4" stopColor="#3b3e37" />
          <stop offset="1" stopColor="#20251f" />
        </linearGradient>
        <linearGradient id={`${id}-ground-glass`} x1="0" y1="0" x2="1" y2=".22">
          <stop offset="0" stopColor="#9eaead" stopOpacity=".63" />
          <stop offset=".2" stopColor="#f8fcf6" stopOpacity=".85" />
          <stop offset=".7" stopColor="#d4dfd8" stopOpacity=".46" />
          <stop offset="1" stopColor="#879996" stopOpacity=".55" />
        </linearGradient>
        <filter
          id={`${id}-contact-soft`}
          x="-35%"
          y="-200%"
          width="180%"
          height="500%"
        >
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter
          id={`${id}-contact-tight`}
          x="-20%"
          y="-150%"
          width="150%"
          height="400%"
        >
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {kind === "water" && (
        <g>
          <ellipse
            cx="168"
            cy="211"
            rx="66"
            ry="6"
            fill="#3a4641"
            opacity=".11"
            filter={paint("contact-soft")}
          />
          <ellipse
            cx="161"
            cy="207"
            rx="45"
            ry="3.3"
            fill="#42544f"
            opacity=".2"
            filter={paint("contact-tight")}
          />
          {/* The back wall and rear half of the lip are seen through the open glass. */}
          <path
            d="M101 48C101 33 219 33 219 48L208 196C207 211 113 211 112 196Z"
            fill={paint("clear-wall")}
            stroke="#738987"
            strokeOpacity=".58"
            strokeWidth=".85"
          />
          <ellipse
            cx="160"
            cy="48"
            rx="59"
            ry="11"
            fill="#f6faf4"
            fillOpacity=".06"
            stroke="#83958f"
            strokeOpacity=".56"
            strokeWidth=".8"
          />
          <ellipse
            cx="160"
            cy="48.3"
            rx="56.4"
            ry="8.8"
            fill="none"
            stroke="#fff"
            strokeOpacity=".8"
            strokeWidth="1"
          />
          <path
            d="M105.5 108C125 98.5 196 98.5 214.5 108L207.1 192C205 203 115 203 112.9 192Z"
            fill={paint("clear-liquid")}
          />
          {/* One continuous elliptical meniscus, with the far edge visible through water. */}
          <ellipse
            cx="160"
            cy="108"
            rx="54.3"
            ry="8.8"
            fill="#eef7f3"
            fillOpacity=".27"
            stroke="#8eacae"
            strokeOpacity=".46"
            strokeWidth=".7"
          />
          <path
            d="M105.7 107.4C106 119 213.7 120 214.4 107.4"
            fill="none"
            stroke="#f9fffb"
            strokeOpacity=".94"
            strokeWidth="1.5"
          />
          <path
            d="M106.5 110C121 120.5 197 120.5 213.4 110"
            fill="none"
            stroke="#779fa5"
            strokeOpacity=".32"
            strokeWidth=".65"
          />
          <path
            d="M112.8 192C124 203 195 203 207.2 192L207 199C195 211 124 211 113 199Z"
            fill={paint("glass-foot")}
          />
          <path
            d="M115 195C137 204 184 204 205 195"
            fill="none"
            stroke="#f9fff9"
            strokeOpacity=".95"
            strokeWidth="1.5"
          />
          <path
            d="M114 201C136 209 187 209 206 201"
            fill="none"
            stroke="#6e8787"
            strokeOpacity=".43"
            strokeWidth=".85"
          />
          {/* Narrow reflected window edges; widening at the base follows the glass thickness. */}
          <path
            d="M107.3 61L116.5 188"
            stroke="#fff"
            strokeOpacity=".77"
            strokeWidth="2.3"
          />
          <path
            d="M112 62L120.6 180"
            stroke="#fff"
            strokeOpacity=".28"
            strokeWidth="5.5"
          />
          <path
            d="M213.9 59L203.9 190"
            stroke="#fff"
            strokeOpacity=".67"
            strokeWidth="1.1"
          />
          <path
            d="M218 62L208.7 190"
            stroke="#617d7f"
            strokeOpacity=".27"
            strokeWidth=".75"
          />
          <path
            d="M102.4 49C105 63 213 63 217.8 49"
            fill="none"
            stroke="#fafffa"
            strokeOpacity=".88"
            strokeWidth="1.45"
          />
          <path
            d="M106.5 53C127 64 198 62 214 54"
            fill="none"
            stroke="#758e8d"
            strokeOpacity=".4"
            strokeWidth=".65"
          />
          <path
            d="M127 202C141 205 173 206 187 203"
            fill="none"
            stroke="#fff"
            strokeOpacity=".75"
            strokeWidth="1.2"
          />
        </g>
      )}

      {kind === "peroxide" && (
        <g>
          <ellipse
            cx="169"
            cy="212"
            rx="61"
            ry="6.5"
            fill="#493d31"
            opacity=".15"
            filter={paint("contact-soft")}
          />
          <ellipse
            cx="160"
            cy="208"
            rx="43"
            ry="3.7"
            fill="#352b22"
            opacity=".3"
            filter={paint("contact-tight")}
          />
          <path
            d="M135 48L135 67C135 75 122 79 115 89C110 96 108 103 108 115L108 192C108 205 121 209 160 209C199 209 212 205 212 192L212 115C212 103 210 96 205 89C198 79 185 75 185 67V48Z"
            fill={paint("bottle-body")}
            stroke="#4f3c2c"
            strokeWidth=".85"
          />
          <path
            d="M112 107C132 111 185 111 208 107L208 190C208 200 196 205 160 205C124 205 112 200 112 190Z"
            fill={paint("bottle-fill")}
          />
          <path
            d="M112 107C131 102 190 102 208 107"
            fill="none"
            stroke="#ddbc7b"
            strokeOpacity=".18"
            strokeWidth=".8"
          />
          <path
            d="M114 112L114 187C114 198 123 201 132 203"
            fill="none"
            stroke="#dfb777"
            strokeOpacity=".38"
            strokeWidth="2.6"
          />
          <path
            d="M139 68C139 80 123 83 119 98L119 118"
            fill="none"
            stroke="#f7dfac"
            strokeOpacity=".48"
            strokeWidth="3.5"
          />
          <path
            d="M146 68C145 80 131 86 129 96"
            fill="none"
            stroke="#fce8bc"
            strokeOpacity=".13"
            strokeWidth="6"
          />
          <path
            d="M184 75C199 88 205 94 206 109L207 187"
            fill="none"
            stroke="#e4c58d"
            strokeOpacity=".16"
            strokeWidth="1.1"
          />
          <path
            d="M120 197C140 204 181 205 200 198"
            fill="none"
            stroke="#c69454"
            strokeOpacity=".32"
            strokeWidth="1.5"
          />
          <path
            d="M116 123C140 127 180 127 204 123L204 176C180 182 140 182 116 176Z"
            fill={paint("paper")}
            stroke="#382d1f"
            strokeOpacity=".25"
            strokeWidth=".7"
          />
          <path
            d="M120 128C145 131 182 131 201 127"
            fill="none"
            stroke="#fffaf0"
            strokeOpacity=".54"
            strokeWidth=".6"
          />
          <text
            x="160"
            y="153"
            textAnchor="middle"
            fill="#4d4a3d"
            fontFamily="Georgia, serif"
            fontSize="19"
            letterSpacing=".5"
          >
            H₂O₂
          </text>
          <path d="M135 160.5H185" stroke="#9c957f" strokeWidth=".55" />
          <text
            x="160"
            y="170"
            textAnchor="middle"
            fill="#746f60"
            fontFamily="Arial, sans-serif"
            fontSize="4.8"
            letterSpacing="1.1"
          >
            AQUEOUS SOLUTION
          </text>
          <path
            d="M131 37C131 32 189 32 189 37L189 56C189 62 131 62 131 56Z"
            fill={paint("cap")}
            stroke="#252a22"
            strokeWidth=".8"
          />
          <ellipse
            cx="160"
            cy="37"
            rx="29"
            ry="4.7"
            fill="#56594e"
            stroke="#282c25"
            strokeWidth=".65"
          />
          <path
            d="M135 42V55M140 43V57M146 44V57M152 44V58M158 44V58M164 44V58M170 44V58M176 43V57M182 42V56M186 41V55"
            stroke="#989b88"
            strokeOpacity=".24"
            strokeWidth=".75"
          />
          <path
            d="M134 37C147 34 174 34 184 37"
            fill="none"
            stroke="#9a9d8e"
            strokeOpacity=".42"
            strokeWidth=".85"
          />
          <path
            d="M136 64C149 66 173 66 184 63"
            fill="none"
            stroke="#d5b780"
            strokeOpacity=".31"
            strokeWidth="1"
          />
        </g>
      )}

      {kind === "gas" && (
        <g>
          <ellipse
            cx="171"
            cy="214"
            rx="61"
            ry="5.5"
            fill="#3d4b43"
            opacity=".12"
            filter={paint("contact-soft")}
          />
          <ellipse
            cx="160"
            cy="209"
            rx="45"
            ry="3.4"
            fill="#40544d"
            opacity=".21"
            filter={paint("contact-tight")}
          />
          {/* An empty-looking, sealed collection jar: reflections belong to glass, not gas. */}
          <path
            d="M128 65L128 80C128 88 109 89 107 106L107 193C107 207 121 211 160 211C199 211 213 207 213 193L213 106C211 89 192 88 192 80V65Z"
            fill={paint("clear-wall")}
            stroke="#80938b"
            strokeOpacity=".62"
            strokeWidth=".9"
          />
          <path
            d="M113 110C140 113 180 113 207 110V193C207 202 196 205 160 205C124 205 113 202 113 193Z"
            fill={accent}
            fillOpacity=".025"
          />
          <path
            d="M108 191C114 204 206 204 212 191V199C203 214 118 214 108 199Z"
            fill={paint("glass-foot")}
          />
          <path
            d="M114 195C137 205 186 205 206 195"
            fill="none"
            stroke="#fff"
            strokeOpacity=".91"
            strokeWidth="1.4"
          />
          <path
            d="M111 202C131 211 189 211 210 202"
            fill="none"
            stroke="#798e88"
            strokeOpacity=".51"
            strokeWidth=".8"
          />
          <path
            d="M135 78C134 92 115 94 115 110L115 188"
            fill="none"
            stroke="#fff"
            strokeOpacity=".75"
            strokeWidth="2.7"
          />
          <path
            d="M140 81C139 95 121 97 121 112V180"
            fill="none"
            stroke="#fff"
            strokeOpacity=".21"
            strokeWidth="5"
          />
          <path
            d="M187 81C189 93 205 95 206 109V188"
            fill="none"
            stroke="#fcfff9"
            strokeOpacity=".79"
            strokeWidth="1.2"
          />
          <path
            d="M191 82C195 91 211 98 211 113V192"
            fill="none"
            stroke="#6d8881"
            strokeOpacity=".19"
            strokeWidth="1.3"
          />
          <ellipse
            cx="160"
            cy="68"
            rx="32"
            ry="5.5"
            fill={paint("ground-glass")}
            stroke="#8a9f95"
            strokeOpacity=".74"
            strokeWidth=".75"
          />
          <path
            d="M135 55L137 78C148 82 172 82 183 78L185 55Z"
            fill={paint("ground-glass")}
            stroke="#8a9b92"
            strokeOpacity=".62"
            strokeWidth=".7"
          />
          <path
            d="M139 59L141 76M143 59L145 77M179 59L178 76"
            stroke="#fff"
            strokeOpacity=".5"
            strokeWidth=".8"
          />
          <path
            d="M130 48C130 41 190 41 190 48V55C190 63 130 63 130 55Z"
            fill={paint("ground-glass")}
            stroke="#80958b"
            strokeOpacity=".76"
            strokeWidth=".85"
          />
          <ellipse
            cx="160"
            cy="47.5"
            rx="30"
            ry="5.5"
            fill="#f2f7ee"
            fillOpacity=".53"
            stroke="#8a9d92"
            strokeOpacity=".7"
            strokeWidth=".75"
          />
          <path
            d="M134 47C146 42 176 43 184 46"
            fill="none"
            stroke="#fff"
            strokeOpacity=".8"
            strokeWidth="1.1"
          />
          <path
            d="M131 56C144 62 179 62 188 56M128 72C145 78 177 78 192 72"
            fill="none"
            stroke="#fff"
            strokeOpacity=".8"
            strokeWidth=".9"
          />
          <path
            d="M131 83C144 88 178 88 189 83"
            fill="none"
            stroke="#8fa398"
            strokeOpacity=".3"
            strokeWidth=".65"
          />
          <path
            d="M125 204C145 207 173 209 191 205"
            fill="none"
            stroke="#fff"
            strokeOpacity=".85"
            strokeWidth="1.1"
          />
        </g>
      )}
    </g>
  );
}
