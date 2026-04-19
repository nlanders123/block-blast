// Block Royale — Custom Neon Icon Pack
// Stroke-based SVGs, uses currentColor for theming via CSS color property

const ICONS = {
    play: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5.14v14.72a1 1 0 001.5.86l11.5-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z"/></svg>`,

    pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="7" y1="5" x2="7" y2="19"/><line x1="17" y1="5" x2="17" y2="19"/></svg>`,

    trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9A6 6 0 0018 9V4H6V9z"/><path d="M6 5H4a1 1 0 00-1 1v1.5A3.5 3.5 0 006.5 11H7"/><path d="M18 5h2a1 1 0 011 1v1.5A3.5 3.5 0 0117.5 11H17"/><line x1="12" y1="15" x2="12" y2="18"/><path d="M8 21h8"/><path d="M8 21l1-3h6l1 3"/></svg>`,

    leaderboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="5" height="9" rx="1"/><rect x="9.5" y="4" width="5" height="17" rx="1"/><rect x="16" y="8" width="5" height="13" rx="1"/></svg>`,

    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,

    replay: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-11.36L1 10"/></svg>`,

    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9.5"/></svg>`,

    volumeOn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.54 8.46a5 5 0 010 7.08"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>`,

    haptics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="2"/><line x1="2" y1="8" x2="2" y2="16"/><line x1="4.5" y1="6" x2="4.5" y2="18"/><line x1="22" y1="8" x2="22" y2="16"/><line x1="19.5" y1="6" x2="19.5" y2="18"/></svg>`,

    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,

    star: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,

    sparkle: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 1l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/></svg>`,

    spark: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M10 2l1.5 5L17 8l-5 2 1 5.5L10 12l-4 3.5 1-5.5-5-2 5.5-1z"/></svg>`,

    hand: `<svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <defs>
            <linearGradient id="handGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#fb923c"/>
                <stop offset="100%" stop-color="#2dd4bf"/>
            </linearGradient>
            <filter id="neonGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>
        <g filter="url(#neonGlow)" stroke="url(#handGlow)" stroke-width="2.5">
            <path d="M28 48V22a4 4 0 118 0v18"/>
            <path d="M36 32v-6a4 4 0 118 0v10"/>
            <path d="M44 34v-4a4 4 0 118 0v10"/>
            <path d="M20 34v-8a4 4 0 118 0v14"/>
            <path d="M20 40c-4 0-6-2-6-6v-4a4 4 0 118 0"/>
            <path d="M52 40v4c0 8-6 14-14 14H32c-8 0-14-6-14-14v-4"/>
        </g>
        <circle cx="32" cy="12" r="3" fill="#fb923c" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite"/>
        </circle>
    </svg>`
};

// Helper to create an icon element
function createIcon(name, size, color) {
    const span = document.createElement('span');
    span.className = 'icon';
    span.innerHTML = ICONS[name] || '';
    const svg = span.querySelector('svg');
    if (svg) {
        svg.setAttribute('width', size || 24);
        svg.setAttribute('height', size || 24);
    }
    if (color) span.style.color = color;
    return span;
}

// Helper to get icon HTML string
function iconHTML(name, size, color) {
    const s = size || 24;
    const c = color ? ` style="color:${color}"` : '';
    const svg = (ICONS[name] || '').replace('<svg ', `<svg width="${s}" height="${s}" `);
    return `<span class="icon"${c}>${svg}</span>`;
}
