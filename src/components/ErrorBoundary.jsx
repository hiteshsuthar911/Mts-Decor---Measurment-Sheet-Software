import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL UNCAUGHT APPLICATION ERROR:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
          <div className="card border-0 shadow-lg p-4 p-md-5 text-center" style={{ maxWidth: '540px', borderRadius: '14px' }}>
            <div className="mb-3">
              <span className="badge bg-danger bg-opacity-10 text-danger p-3 rounded-circle fs-3">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </span>
            </div>
            <h3 className="fw-bolder text-dark mb-2 text-uppercase">Something Went Wrong</h3>
            <p className="text-secondary small mb-4">
              An unexpected error occurred while rendering the page. Don't worry, your data is safe in the cloud database.
            </p>

            <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
              <button
                type="button"
                className="btn btn-dark fw-bold text-uppercase px-4 py-2"
                onClick={this.handleReload}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>Reload Page
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary fw-bold text-uppercase px-4 py-2"
                onClick={this.handleGoHome}
              >
                <i className="bi bi-house-door me-2"></i>Go to Home
              </button>
            </div>

            {this.state.error && (
              <details className="text-start mt-3 p-2 bg-light rounded border extra-small text-muted">
                <summary style={{ cursor: 'pointer' }} className="fw-semibold">Error Details (for developers)</summary>
                <pre className="mt-2 mb-0" style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
