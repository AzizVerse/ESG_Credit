function EquoraLogo({ compact = false }) {
  return (
    <div className={`equora-brand${compact ? " equora-brand-compact" : ""}`} role="img" aria-label="EQUORA, STB Bank">
      <svg className="equora-symbol" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="M8 34C7 20 21 7 32 8c10 1 14 11 13 24-6-11-24-13-37 2Z" fill="var(--logo-sage)" />
        <path d="M34 8c16 2 26 17 21 34l-10-5c5-14 2-24-11-29Z" fill="var(--logo-ivory)" />
        <path d="M27 22C8 28 8 48 23 55c6 2 13 1 17-2-14-7-23-18-13-31Z" fill="var(--logo-teal)" />
        <path d="M25 39c11 7 22 0 29 11l8 5c-14 6-26-3-37-16Z" fill="var(--logo-teal)" />
      </svg>
      <span className="equora-brand-type"><span className="equora-brand-name">EQUORA</span><span className="equora-brand-bank">STB BANK</span></span>
    </div>
  );
}

export default EquoraLogo;
