import { useId } from "react";
import type { Artwork } from "../data/types";
import { MaterialArt } from "./MaterialArt";

const defaultLabels: Record<Artwork, string> = {
  water: "Water in a glass",
  peroxide: "Hydrogen peroxide solution bottle",
  gas: "Gas collection vessel",
  salt: "Salt crystals",
  metal: "Metal strip",
  mineral: "Limestone mineral",
  carbon: "Graphite block",
  sand: "Sand grains",
  liquid: "Liquid in a flask",
  crystal: "Quartz crystal",
  fertilizer: "Fertilizer granules",
  sulfur: "Sulfur crystal",
};

const defaultColors: Record<Artwork, string> = {
  water: "#7db8c7",
  peroxide: "#ad7042",
  gas: "#a6c6c8",
  salt: "#d8d6cb",
  metal: "#a8b4ba",
  mineral: "#b9a27c",
  carbon: "#687077",
  sand: "#c89c60",
  liquid: "#80aaa3",
  crystal: "#91b7bb",
  fertilizer: "#83956e",
  sulfur: "#d2bd68",
};

export function SubstanceArt({
  kind,
  color,
  label,
  className,
}: {
  kind: Artwork;
  color?: string;
  label?: string;
  className?: string;
}) {
  const reactId = useId();
  const id = `substance-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const titleId = `${id}-title`;
  const accent = color || defaultColors[kind];

  return (
    <svg
      className={className}
      viewBox="0 0 320 240"
      width="100%"
      height="100%"
      role="img"
      aria-labelledby={titleId}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={titleId}>{label || defaultLabels[kind]}</title>
      {kind === "peroxide" && (
        <desc>
          A brown bottle illustrates hydrogen peroxide in aqueous solution; the
          interface supplies this packaging context.
        </desc>
      )}
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.78" />
          <stop offset="0.16" stopColor={accent} stopOpacity="0.2" />
          <stop offset="0.48" stopColor="#ffffff" stopOpacity="0.58" />
          <stop offset="0.82" stopColor={accent} stopOpacity="0.12" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#d8eff0" stopOpacity="0.9" />
          <stop offset="0.45" stopColor={accent} stopOpacity="0.68" />
          <stop offset="1" stopColor="#5f929f" stopOpacity="0.76" />
        </linearGradient>
        <linearGradient id={`${id}-amber`} x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0" stopColor="#794321" stopOpacity="0.93" />
          <stop offset="0.2" stopColor="#d59a4f" stopOpacity="0.9" />
          <stop offset="0.48" stopColor="#f0c477" stopOpacity="0.75" />
          <stop offset="0.72" stopColor="#a9602e" stopOpacity="0.95" />
          <stop offset="1" stopColor="#69391f" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0.75">
          <stop offset="0" stopColor="#67777e" />
          <stop offset="0.16" stopColor="#e0e7e5" />
          <stop offset="0.32" stopColor="#929fa1" />
          <stop offset="0.52" stopColor="#f4f1e7" />
          <stop offset="0.75" stopColor="#889699" />
          <stop offset="1" stopColor="#d8ddda" />
        </linearGradient>
        <linearGradient id={`${id}-stone`} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#e4d7bc" />
          <stop offset="0.48" stopColor={accent} />
          <stop offset="1" stopColor="#8f795b" />
        </linearGradient>
        <linearGradient id={`${id}-crystal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafff8" stopOpacity="0.96" />
          <stop offset="0.28" stopColor={accent} stopOpacity="0.8" />
          <stop offset="0.62" stopColor="#d8e8df" stopOpacity="0.84" />
          <stop offset="1" stopColor="#789995" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id={`${id}-sand`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ecd6a8" />
          <stop offset="0.55" stopColor={accent} />
          <stop offset="1" stopColor="#9e7445" />
        </linearGradient>
      </defs>

      {(kind === "water" || kind === "peroxide" || kind === "gas") && (
        <MaterialArt kind={kind} id={id} accent={accent} />
      )}
      {kind === "salt" && (
        <g strokeLinejoin="round">
          <ellipse
            cx="160"
            cy="164"
            rx="91"
            ry="25"
            fill="#e9e3d7"
            stroke="#bcb5a8"
            strokeWidth="2"
          />
          <ellipse
            cx="160"
            cy="160"
            rx="79"
            ry="17"
            fill="#f8f5ed"
            stroke="#d8d0c2"
          />
          <path
            d="M95 153C111 138 126 132 140 121C151 111 170 111 181 121C196 134 210 143 224 153C210 165 110 165 95 153Z"
            fill="#eeeae0"
            stroke="#c9c6bc"
          />
          <path
            d="M124 137L132 130L140 137L140 146L132 151L124 146Z"
            fill="#ffffff"
            stroke="#c3c4be"
          />
          <path
            d="M145 125L154 119L162 125L161 135L153 140L145 135Z"
            fill="#fafaf5"
            stroke="#c9c8bf"
          />
          <path
            d="M168 132L176 126L184 132L184 141L176 146L168 141Z"
            fill="#f7f6ee"
            stroke="#c4c4bc"
          />
          <path
            d="M185 147L193 141L201 147L200 155L192 159L185 155Z"
            fill="#fffefa"
            stroke="#ceccc3"
          />
          <path
            d="M107 150L114 145L121 150L120 157L113 160L107 157Z"
            fill="#fffefa"
            stroke="#ceccc3"
          />
          <path
            d="M151 145L158 141L165 145V153L158 157L151 153Z"
            fill="#ffffff"
            stroke="#c8c8c1"
          />
          <path
            d="M138 120L143 116M177 119L181 123M206 149L211 153"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

      {kind === "metal" && (
        <g strokeLinejoin="round">
          <path
            d="M75 133L199 84L243 104L118 155Z"
            fill="#69787d"
            opacity="0.5"
          />
          <path
            d="M70 120L195 70L246 95L120 146Z"
            fill={`url(#${id}-metal)`}
            stroke="#78858a"
            strokeWidth="2"
          />
          <path
            d="M120 146L246 95V111L120 163Z"
            fill="#879397"
            stroke="#6e7d81"
            strokeWidth="1.5"
          />
          <path
            d="M70 120V135L120 163V146Z"
            fill="#c7ceca"
            stroke="#78858a"
            strokeWidth="1.5"
          />
          <path
            d="M81 120L195 75M91 126L205 81M102 132L215 86"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.45"
            strokeWidth="1.3"
          />
          <path
            d="M139 146L234 107"
            fill="none"
            stroke="#dfe5df"
            strokeWidth="1.4"
            opacity="0.8"
          />
          <path
            d="M95 111L192 72"
            fill="none"
            stroke={accent}
            strokeOpacity="0.85"
            strokeWidth="2"
          />
          <ellipse
            cx="160"
            cy="177"
            rx="81"
            ry="8"
            fill="#627177"
            opacity="0.15"
          />
        </g>
      )}

      {kind === "mineral" && (
        <g strokeLinejoin="round">
          <path
            d="M79 130L102 91L156 73L220 92L243 131L218 170L126 180L78 158Z"
            fill={`url(#${id}-stone)`}
            stroke="#907e61"
            strokeWidth="2"
          />
          <path
            d="M79 130L126 142L243 131M126 142L126 180M126 142L156 73M126 142L102 91"
            fill="none"
            stroke="#f1e5cf"
            strokeWidth="2"
            opacity="0.8"
          />
          <path
            d="M80 149L126 158L238 146"
            fill="none"
            stroke="#8c7657"
            strokeOpacity="0.42"
            strokeWidth="2"
          />
          <path
            d="M101 119L126 126L147 119M168 96L201 107M156 159L202 154"
            fill="none"
            stroke="#f4ead9"
            strokeOpacity="0.55"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M95 133L108 136M222 123L234 126M138 169L149 168"
            stroke="#807052"
            strokeOpacity="0.42"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M102 91L156 73L168 81L116 101Z"
            fill="#eadcc2"
            opacity="0.68"
          />
          <ellipse
            cx="160"
            cy="181"
            rx="82"
            ry="8"
            fill="#78674f"
            opacity="0.14"
          />
        </g>
      )}

      {kind === "carbon" && (
        <g strokeLinejoin="round">
          <path
            d="M78 123L133 91L231 111L177 145Z"
            fill="#4e5559"
            stroke="#353d41"
            strokeWidth="2"
          />
          <path
            d="M78 123V158L177 183V145Z"
            fill="#737b7d"
            stroke="#454d50"
            strokeWidth="2"
          />
          <path
            d="M177 145L231 111V146L177 183Z"
            fill="#353e43"
            stroke="#2e363a"
            strokeWidth="2"
          />
          <path
            d="M88 132L177 154M88 141L177 164M88 150L177 174"
            stroke="#aeb4b0"
            strokeOpacity="0.46"
            strokeWidth="2"
          />
          <path
            d="M99 120L135 99L216 115M187 151L219 131"
            fill="none"
            stroke="#c5cac4"
            strokeOpacity="0.75"
            strokeWidth="2"
          />
          <path
            d="M109 115L139 99M121 119L151 103M133 122L163 106"
            stroke="#d9ded6"
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
          <ellipse
            cx="160"
            cy="187"
            rx="82"
            ry="8"
            fill="#343b3d"
            opacity="0.18"
          />
        </g>
      )}

      {kind === "sand" && (
        <g strokeLinejoin="round">
          <path
            d="M77 165C97 156 106 145 124 133C139 122 145 103 162 101C181 99 187 122 201 134C216 147 224 155 244 165C213 178 107 178 77 165Z"
            fill={`url(#${id}-sand)`}
            stroke="#a98250"
            strokeWidth="1.5"
          />
          <path
            d="M91 162C124 167 194 167 229 161"
            fill="none"
            stroke="#f0dbb1"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M110 152C132 156 184 156 207 151"
            fill="none"
            stroke="#b58b55"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.55"
          />
          <g fill="#d3ad74" stroke="#a77f4e" strokeWidth="0.8">
            <circle cx="88" cy="177" r="3" />
            <circle cx="104" cy="183" r="2.5" />
            <circle cx="123" cy="177" r="2" />
            <circle cx="140" cy="184" r="3" />
            <circle cx="160" cy="178" r="2.4" />
            <circle cx="181" cy="184" r="2.8" />
            <circle cx="200" cy="178" r="2.3" />
            <circle cx="219" cy="183" r="3" />
            <circle cx="236" cy="176" r="2" />
            <circle cx="96" cy="150" r="2" />
            <circle cx="216" cy="145" r="2.3" />
          </g>
          <path
            d="M154 108L161 105L165 111L160 115Z"
            fill="#f3dfb5"
            opacity="0.8"
          />
        </g>
      )}

      {kind === "liquid" && (
        <g strokeLinejoin="round">
          <path
            d="M127 52H193V61H185V95L217 151C225 166 215 178 199 178H121C105 178 95 166 103 151L135 95V61H127Z"
            fill={`url(#${id}-glass)`}
            stroke="#79999a"
            strokeWidth="2"
          />
          <path
            d="M127 52H193V62H127Z"
            fill="#f7fcf5"
            stroke="#79999a"
            strokeWidth="2"
          />
          <path
            d="M119 137C143 143 178 143 201 137L216 159C221 170 212 174 199 174H121C108 174 100 169 106 157Z"
            fill={accent}
            opacity="0.76"
          />
          <path
            d="M119 137C143 143 178 143 201 137"
            fill="none"
            stroke="#effff4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M134 66V96L108 149M186 66V96L211 149"
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M117 128L131 132M121 117L133 120M125 106L136 109"
            stroke="#819c98"
            strokeWidth="1.5"
          />
          <circle cx="157" cy="151" r="3" fill="#f5fff1" opacity="0.7" />
        </g>
      )}

      {kind === "crystal" && (
        <g strokeLinejoin="round">
          <path
            d="M83 169L101 139L119 147L134 121L150 132L167 100L186 118L202 108L224 140L239 168Z"
            fill="#d5e2d7"
            stroke="#829e98"
            strokeWidth="2"
          />
          <path
            d="M102 141L119 95L138 130L119 147Z"
            fill={`url(#${id}-crystal)`}
            stroke="#77918d"
            strokeWidth="1.8"
          />
          <path
            d="M119 95L130 87L145 124L138 130Z"
            fill="#f6fff7"
            stroke="#829e98"
            strokeWidth="1.5"
          />
          <path
            d="M141 132L167 70L188 118L169 140Z"
            fill={`url(#${id}-crystal)`}
            stroke="#718d89"
            strokeWidth="2"
          />
          <path
            d="M167 70L180 82L194 117L188 118Z"
            fill="#effcf2"
            stroke="#829e98"
            strokeWidth="1.5"
          />
          <path
            d="M169 140L188 118L202 108L215 142L196 158Z"
            fill="#b5d0c7"
            stroke="#829e98"
            strokeWidth="1.5"
          />
          <path
            d="M84 169L239 168L223 180H98Z"
            fill="#a8c1b7"
            stroke="#819b94"
            strokeWidth="1.5"
          />
          <path
            d="M119 98L123 132M167 76L165 127M181 89L189 116"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.82"
          />
          <circle cx="101" cy="160" r="3" fill="#f5fff1" />
          <ellipse
            cx="160"
            cy="185"
            rx="84"
            ry="7"
            fill="#718984"
            opacity="0.14"
          />
        </g>
      )}

      {kind === "fertilizer" && (
        <g strokeLinejoin="round">
          <path
            d="M103 79L217 79L209 169C208 178 202 182 194 182H126C118 182 112 178 111 169Z"
            fill="#e5ddc9"
            stroke="#988f7b"
            strokeWidth="2"
          />
          <path
            d="M103 79L217 79L211 96L108 96Z"
            fill="#a2ad88"
            stroke="#7c886a"
            strokeWidth="2"
          />
          <path d="M110 97H210L205 157H115Z" fill="#eee8d8" />
          <path
            d="M118 118C139 110 181 110 202 118L198 162H122Z"
            fill="#d5d0bc"
            stroke="#aaa590"
          />
          <g fill="#82956b" stroke="#657653" strokeWidth="1">
            <ellipse
              cx="132"
              cy="141"
              rx="5"
              ry="3.5"
              transform="rotate(-20 132 141)"
            />
            <ellipse
              cx="149"
              cy="130"
              rx="5"
              ry="3.5"
              transform="rotate(18 149 130)"
            />
            <ellipse
              cx="166"
              cy="145"
              rx="5"
              ry="3.5"
              transform="rotate(-12 166 145)"
            />
            <ellipse
              cx="184"
              cy="131"
              rx="5"
              ry="3.5"
              transform="rotate(22 184 131)"
            />
            <ellipse
              cx="194"
              cy="151"
              rx="5"
              ry="3.5"
              transform="rotate(-24 194 151)"
            />
            <ellipse
              cx="145"
              cy="155"
              rx="5"
              ry="3.5"
              transform="rotate(14 145 155)"
            />
            <ellipse
              cx="177"
              cy="159"
              rx="5"
              ry="3.5"
              transform="rotate(-14 177 159)"
            />
          </g>
          <path
            d="M118 111C139 105 180 105 202 111"
            fill="none"
            stroke="#faf7ea"
            strokeWidth="2"
          />
          <path
            d="M112 84L209 84"
            stroke="#f7f1df"
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          <ellipse
            cx="160"
            cy="184"
            rx="62"
            ry="7"
            fill="#756e5d"
            opacity="0.13"
          />
        </g>
      )}

      {kind === "sulfur" && (
        <g strokeLinejoin="round">
          <path
            d="M83 157L99 127L121 123L131 98L155 90L170 107L198 104L218 128L239 151L224 173L190 179L161 173L132 182L101 176Z"
            fill="#e1cc71"
            stroke="#a8954e"
            strokeWidth="2"
          />
          <path
            d="M99 127L121 123L131 98L155 90L149 122L128 143Z"
            fill="#f3e59b"
            stroke="#b9a75e"
            strokeWidth="1.5"
          />
          <path
            d="M155 90L170 107L198 104L184 132L149 122Z"
            fill="#f7e89a"
            stroke="#b9a75e"
            strokeWidth="1.5"
          />
          <path
            d="M128 143L149 122L184 132L190 179L161 173L132 182Z"
            fill="#d1b958"
            stroke="#a18d45"
            strokeWidth="1.5"
          />
          <path
            d="M184 132L198 104L218 128L239 151L224 173L190 179Z"
            fill="#e8d47b"
            stroke="#aa984e"
            strokeWidth="1.5"
          />
          <path
            d="M105 130L119 128M156 96L165 108M202 111L213 128M137 152L151 142"
            stroke="#fff2b5"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.82"
          />
          <path
            d="M98 162L128 169L153 161"
            fill="none"
            stroke="#aa9649"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
          <ellipse
            cx="160"
            cy="181"
            rx="81"
            ry="8"
            fill="#88773f"
            opacity="0.15"
          />
        </g>
      )}
    </svg>
  );
}
