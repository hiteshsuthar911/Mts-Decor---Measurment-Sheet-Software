import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Pixel-perfect official styled App Store and Google Play Badges
 */
export function AppStoreBadge({ height = 44, className = '', onClick }) {
  return (
    <div
      className={`app-store-badge d-inline-flex align-items-center justify-content-center text-white ${className}`}
      onClick={onClick}
      style={{
        height: `${height}px`,
        backgroundColor: '#000000',
        borderRadius: `${height * 0.18}px`,
        border: '1px solid rgba(255, 255, 255, 0.35)',
        padding: `0 ${height * 0.38}px`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        textDecoration: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      }}
    >
      {/* Apple Logo SVG */}
      <svg
        viewBox="0 0 170 170"
        style={{ height: `${height * 0.62}px`, width: 'auto', fill: '#ffffff', marginRight: `${height * 0.22}px` }}
      >
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.64-7.85-11.82-14.43-5.59-8.7-10.05-18.73-13.38-30.08-3.34-11.36-5.01-22.18-5.01-32.48 0-14.56 3.65-26.65 10.96-36.27 7.3-9.62 16.5-14.5 27.59-14.64 4.89 0 10.15 1.25 15.78 3.76 5.63 2.5 9.4 3.82 11.3 3.94 1.57-.12 5.56-1.5 11.97-4.14 6.41-2.65 11.96-3.86 16.65-3.63 12.63.63 22.84 5.38 30.64 14.25-10.99 6.64-16.32 15.65-15.98 27.02.34 9.07 3.84 16.71 10.51 22.92 6.67 6.21 14.36 9.77 23.08 10.68-2.46 7.42-5.49 14.73-9.08 21.94zM119.22 33.64c0-7.38 2.65-14.38 7.96-21.01 5.31-6.63 11.83-10.96 19.56-13 1.05 8.15-.96 15.48-6.03 21.99-5.06 6.51-11.82 10.74-20.28 12.69-.37-.89-.71-1.78-.71-2.67z" />
      </svg>
      {/* Text Lines */}
      <div className="d-flex flex-column text-start" style={{ lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: `${Math.max(9, height * 0.22)}px`,
            letterSpacing: '0.02em',
            color: '#e2e8f0',
            fontWeight: 400,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          Available on the
        </span>
        <span
          style={{
            fontSize: `${Math.max(13, height * 0.40)}px`,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          App Store
        </span>
      </div>
    </div>
  );
}

export function GooglePlayBadge({ height = 44, className = '', onClick }) {
  return (
    <div
      className={`google-play-badge d-inline-flex align-items-center justify-content-center text-white ${className}`}
      onClick={onClick}
      style={{
        height: `${height}px`,
        backgroundColor: '#000000',
        borderRadius: `${height * 0.18}px`,
        border: '1px solid rgba(255, 255, 255, 0.35)',
        padding: `0 ${height * 0.38}px`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        textDecoration: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      }}
    >
      {/* Google Play Colorful Triangle Logo */}
      <svg
        viewBox="0 0 512 512"
        style={{ height: `${height * 0.60}px`, width: 'auto', marginRight: `${height * 0.22}px` }}
      >
        <path
          d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"
          fill="#00e5ff"
        />
        <path
          d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256-256L47 0z"
          fill="#00e676"
        />
        <path
          d="M325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z"
          fill="#ff3d00"
        />
        <path
          d="M456.4 211.7l-71 44.3-60.1-60.1 60.1-60.1 71 44.3c15.1 9.4 24.6 24.3 24.6 40.8s-9.5 31.4-24.6 40.8z"
          fill="#ffd600"
        />
      </svg>
      {/* Text Lines */}
      <div className="d-flex flex-column text-start" style={{ lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: `${Math.max(8, height * 0.20)}px`,
            letterSpacing: '0.08em',
            color: '#cbd5e1',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          GET IT ON
        </span>
        <span
          style={{
            fontSize: `${Math.max(13, height * 0.40)}px`,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          Google Play
        </span>
      </div>
    </div>
  );
}

/**
 * Combined Footer/Section Badge Row linking to the Apps/Download page
 */
export default function AppStoreBadges({
  height = 40,
  showWindowsMac = true,
  align = 'center',
  className = ''
}) {
  return (
    <div className={`app-store-badges-container d-flex flex-wrap align-items-center justify-content-${align} gap-2 ${className}`}>
      <Link to="/download" className="text-decoration-none">
        <AppStoreBadge height={height} />
      </Link>
      <Link to="/download" className="text-decoration-none">
        <GooglePlayBadge height={height} />
      </Link>
      {showWindowsMac && (
        <Link
          to="/download"
          className="btn btn-outline-dark d-inline-flex align-items-center gap-2 fw-semibold extra-small text-uppercase px-3"
          style={{
            height: `${height}px`,
            borderRadius: `${height * 0.18}px`,
            borderColor: '#cbd5e1',
            backgroundColor: '#ffffff'
          }}
        >
          <i className="bi bi-laptop fs-6 text-primary"></i>
          <span>Windows & Mac</span>
        </Link>
      )}
    </div>
  );
}
