import React, { useState, useEffect } from 'react';
import './UiverseLoginButton.css';

export default function UiverseLoginButton({ loading = false, disabled = false, onClick }) {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsChecked(true);
    } else {
      setIsChecked(false);
    }
  }, [loading]);

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    // Toggle checked state
    const nextChecked = !isChecked;
    setIsChecked(nextChecked);

    if (onClick) {
      onClick(e);
      return;
    }

    // If inside a form, check validity and trigger submission
    const form = e.currentTarget.closest('form');
    if (form) {
      if (typeof form.requestSubmit === 'function') {
        if (form.checkValidity()) {
          form.requestSubmit();
        } else {
          form.reportValidity();
        }
      }
    }
  };

  return (
    <div className="uiverse-login-btn-wrapper">
      <label className="area" onClick={handleClick}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          disabled={disabled || loading}
        />
        <div className="area-button">
          <svg
            width="423"
            height="274"
            viewBox="0 0 423 274"
            fill="none"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M93.3368 136.663C49.6104 128.127 30.5087 134.168 2.08112 145.122"
              strokeLinecap="round"
            />
            <path
              d="M94.6914 170.451C55.042 190.819 43.7361 207.401 28.1198 233.623"
              strokeLinecap="round"
            />
            <path
              d="M147.365 181.074C124.487 219.412 123.652 239.483 124.252 270.021"
              strokeLinecap="round"
            />
            <path d="M209.461 179.848L209.461 271.744" strokeLinecap="round" />
            <path
              d="M271.59 181.074C294.468 219.412 295.303 239.483 294.703 270.021"
              strokeLinecap="round"
            />
            <path
              d="M327.264 170.451C366.913 190.819 378.219 207.401 393.835 233.623"
              strokeLinecap="round"
            />
            <path
              d="M329.618 136.663C373.345 128.127 392.446 134.168 420.874 145.122"
              strokeLinecap="round"
            />
            <path
              d="M328.313 104.665C355.465 69.244 373.772 61.0955 402.313 50.4414"
              strokeLinecap="round"
            />
            <path
              d="M268.666 93.3922C282.624 50.9621 297.219 37.204 320.646 17.6894"
              strokeLinecap="round"
            />
            <path d="M209.461 93.5837L209.461 1.68781" strokeLinecap="round" />
            <path
              d="M150.289 93.3922C136.331 50.9621 121.736 37.204 98.3089 17.6894"
              strokeLinecap="round"
            />
            <path
              d="M93.6422 104.665C66.4898 69.244 48.1828 61.0955 19.6421 50.4414"
              strokeLinecap="round"
            />
          </svg>

          <button type="button" className="button" tabIndex={-1}>
            <div className="wrap">
              <span className="particles">
                <span
                  className="particle"
                  style={{ '--a': '-45deg', '--x': '53%', '--y': '15%', '--d': '4em', '--f': 0.7, '--t': 0.15 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '150deg', '--x': '40%', '--y': '70%', '--d': '7.5em', '--f': 0.8, '--t': 0.08 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '10deg', '--x': '90%', '--y': '65%', '--d': '7em', '--f': 0.6, '--t': 0.25 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '-120deg', '--x': '15%', '--y': '10%', '--d': '4em' }}
                />
                <span
                  className="particle"
                  style={{ '--a': '-175deg', '--x': '10%', '--y': '25%', '--d': '5.25em', '--f': 0.6, '--t': 0.32 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '-18deg', '--x': '80%', '--y': '25%', '--d': '4.75em', '--f': 0.5, '--t': 0.4 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '-30deg', '--x': '60%', '--y': '45%', '--d': '9em', '--f': 0.9, '--t': 0.5 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '175deg', '--x': '9%', '--y': '30%', '--d': '6em', '--f': 0.95, '--t': 0.6 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '-10deg', '--x': '89%', '--y': '25%', '--d': '4.5em', '--f': 0.55, '--t': 0.67 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '-140deg', '--x': '40%', '--y': '10%', '--d': '5em', '--f': 0.85, '--t': 0.75 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '90deg', '--x': '45%', '--y': '65%', '--d': '4em', '--f': 0.5, '--t': 0.83 }}
                />
                <span
                  className="particle"
                  style={{ '--a': '30deg', '--x': '70%', '--y': '80%', '--d': '6.5em', '--f': 0.75, '--t': 0.92 }}
                />
              </span>

              <div className="electric" />
              <div className="glass" />
              <div className="reflex" />
              <div className="outline">
                <div className="rainbow" />
              </div>

              <div className="text">
                <p className="state-1">
                  <span style={{ '--i': 1 }}><span>G</span></span>
                  <span style={{ '--i': 2 }}><span>e</span></span>
                  <span style={{ '--i': 3, marginRight: '6px' }}><span>t</span></span>
                  <span style={{ '--i': 4 }}><span>S</span></span>
                  <span style={{ '--i': 5 }}><span>t</span></span>
                  <span style={{ '--i': 6 }}><span>a</span></span>
                  <span style={{ '--i': 7 }}><span>r</span></span>
                  <span style={{ '--i': 8 }}><span>t</span></span>
                  <span style={{ '--i': 9 }}><span>e</span></span>
                  <span style={{ '--i': 10 }}><span>d</span></span>
                </p>
                <p className="state-2">
                  <span style={{ '--i': 1 }}><span>L</span></span>
                  <span style={{ '--i': 2 }}><span>e</span></span>
                  <span style={{ '--i': 3 }}><span>t</span></span>
                  <span style={{ '--i': 4 }}><span>'</span></span>
                  <span style={{ '--i': 5, marginRight: '6px' }}><span>s</span></span>
                  <span style={{ '--i': 6 }}><span>C</span></span>
                  <span style={{ '--i': 7 }}><span>o</span></span>
                  <span style={{ '--i': 8 }}><span>o</span></span>
                  <span style={{ '--i': 9 }}><span>k</span></span>
                  <span style={{ '--i': 10 }}><span>!</span></span>
                </p>
              </div>

              <div className="liquid">
                <div className="wave" />
              </div>

              <div className="bg" />
            </div>
          </button>
        </div>
      </label>

      {/* SVG Turbulence Filters for Electric Border Effect */}
      <svg className="svg-turbulence" aria-hidden="true" width="0" height="0">
        <defs>
          <filter
            id="turbulent-displace-0"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="1" result="n1" />
            <feOffset in="n1" dx="0" dy="140" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="1" result="n2" />
            <feOffset in="n2" dx="0" dy="-140" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="2" result="n3" />
            <feOffset in="n3" dx="98" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="2" result="n4" />
            <feOffset in="n4" dx="-98" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="16" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-1"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="3" result="n1" />
            <feOffset in="n1" dx="0" dy="220" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="3" result="n2" />
            <feOffset in="n2" dx="0" dy="-220" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="4" result="n3" />
            <feOffset in="n3" dx="160" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="4" result="n4" />
            <feOffset in="n4" dx="-160" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="18" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-2"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="5" result="n1" />
            <feOffset in="n1" dx="0" dy="310" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="5" result="n2" />
            <feOffset in="n2" dx="0" dy="-310" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="6" result="n3" />
            <feOffset in="n3" dx="230" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="6" result="n4" />
            <feOffset in="n4" dx="-230" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="20" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-3"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="7" result="n1" />
            <feOffset in="n1" dx="0" dy="420" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="7" result="n2" />
            <feOffset in="n2" dx="0" dy="-420" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.023" numOctaves="8" seed="8" result="n3" />
            <feOffset in="n3" dx="320" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.023" numOctaves="8" seed="8" result="n4" />
            <feOffset in="n4" dx="-320" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="22" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-4"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="9" result="n1" />
            <feOffset in="n1" dx="0" dy="540" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="9" result="n2" />
            <feOffset in="n2" dx="0" dy="-540" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="10" result="n3" />
            <feOffset in="n3" dx="410" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="10" result="n4" />
            <feOffset in="n4" dx="-410" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="24" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-5"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.024" numOctaves="8" seed="11" result="n1" />
            <feOffset in="n1" dx="0" dy="660" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.024" numOctaves="8" seed="11" result="n2" />
            <feOffset in="n2" dx="0" dy="-660" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.017" numOctaves="9" seed="12" result="n3" />
            <feOffset in="n3" dx="490" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.017" numOctaves="9" seed="12" result="n4" />
            <feOffset in="n4" dx="-490" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="26" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-6"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="13" result="n1" />
            <feOffset in="n1" dx="0" dy="780" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="13" result="n2" />
            <feOffset in="n2" dx="0" dy="-780" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="14" result="n3" />
            <feOffset in="n3" dx="600" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="14" result="n4" />
            <feOffset in="n4" dx="-600" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="28" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-7"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="15" result="n1" />
            <feOffset in="n1" dx="0" dy="900" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="15" result="n2" />
            <feOffset in="n2" dx="0" dy="-900" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="16" result="n3" />
            <feOffset in="n3" dx="720" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="16" result="n4" />
            <feOffset in="n4" dx="-720" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="30" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-8"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.023" numOctaves="8" seed="17" result="n1" />
            <feOffset in="n1" dx="0" dy="1040" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.023" numOctaves="8" seed="17" result="n2" />
            <feOffset in="n2" dx="0" dy="-1040" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="18" result="n3" />
            <feOffset in="n3" dx="860" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="18" result="n4" />
            <feOffset in="n4" dx="-860" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="31" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-9"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="19" result="n1" />
            <feOffset in="n1" dx="0" dy="1180" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="19" result="n2" />
            <feOffset in="n2" dx="0" dy="-1180" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="20" result="n3" />
            <feOffset in="n3" dx="980" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="20" result="n4" />
            <feOffset in="n4" dx="-980" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="29" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-10"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="21" result="n1" />
            <feOffset in="n1" dx="0" dy="1320" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="21" result="n2" />
            <feOffset in="n2" dx="0" dy="-1320" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.024" numOctaves="8" seed="22" result="n3" />
            <feOffset in="n3" dx="1120" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.024" numOctaves="8" seed="22" result="n4" />
            <feOffset in="n4" dx="-1120" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="33" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-11"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="23" result="n1" />
            <feOffset in="n1" dx="0" dy="1460" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.021" numOctaves="9" seed="23" result="n2" />
            <feOffset in="n2" dx="0" dy="-1460" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="24" result="n3" />
            <feOffset in="n3" dx="1260" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="24" result="n4" />
            <feOffset in="n4" dx="-1260" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="31" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-12"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="25" result="n1" />
            <feOffset in="n1" dx="0" dy="1600" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="25" result="n2" />
            <feOffset in="n2" dx="0" dy="-1600" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="26" result="n3" />
            <feOffset in="n3" dx="1400" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="26" result="n4" />
            <feOffset in="n4" dx="-1400" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="34" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-13"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="27" result="n1" />
            <feOffset in="n1" dx="0" dy="1740" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.019" numOctaves="9" seed="27" result="n2" />
            <feOffset in="n2" dx="0" dy="-1740" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.023" numOctaves="8" seed="28" result="n3" />
            <feOffset in="n3" dx="1540" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.023" numOctaves="8" seed="28" result="n4" />
            <feOffset in="n4" dx="-1540" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="31" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-14"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.024" numOctaves="8" seed="29" result="n1" />
            <feOffset in="n1" dx="0" dy="1880" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.024" numOctaves="8" seed="29" result="n2" />
            <feOffset in="n2" dx="0" dy="-1880" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="30" result="n3" />
            <feOffset in="n3" dx="1680" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="9" seed="30" result="n4" />
            <feOffset in="n4" dx="-1680" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="34" xChannelSelector="R" yChannelSelector="B" />
          </filter>

          <filter
            id="turbulent-displace-15"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="260px"
            height="520px"
          >
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="31" result="n1" />
            <feOffset in="n1" dx="0" dy="2020" result="o1" />
            <feTurbulence type="turbulence" baseFrequency="0.020" numOctaves="9" seed="31" result="n2" />
            <feOffset in="n2" dx="0" dy="-2020" result="o2" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="32" result="n3" />
            <feOffset in="n3" dx="1820" dy="0" result="o3" />
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="8" seed="32" result="n4" />
            <feOffset in="n4" dx="-1820" dy="0" result="o4" />
            <feComposite in="o1" in2="o2" result="p1" />
            <feComposite in="o3" in2="o4" result="p2" />
            <feBlend in="p1" in2="p2" mode="color-dodge" result="cn" />
            <feDisplacementMap in="SourceGraphic" in2="cn" scale="32" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
