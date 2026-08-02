import React from 'react';

/**
 * Catches render-time errors anywhere below it.
 *
 * Without this, a single unexpected value — a malformed RPC response, a missing
 * field on an IPFS document — throws during render and React unmounts the whole
 * tree, leaving a blank white page with no indication of what happened. This
 * keeps the failure visible and recoverable, and never renders a partial money
 * figure as if it were real.
 *
 * Styles are inline on purpose: if the failure is in the stylesheet pipeline, a
 * fallback that depends on CSS fails too.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled render error:', error, errorInfo?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isDev = import.meta.env?.DEV;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0b0b0f',
          color: '#e8e8ed',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>
            Something went wrong on this page
          </h1>
          <p style={{ opacity: 0.75, lineHeight: 1.5, marginBottom: '20px' }}>
            No transaction was submitted and nothing was changed on-chain by this
            error. Reloading usually clears it. If it keeps happening, your funds
            and jobs are unaffected — the failure is in this page, not in the
            contracts.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #3a3a45',
              background: '#1a1a22',
              color: '#e8e8ed',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Reload page
          </button>
          {isDev && (
            <pre
              style={{
                marginTop: '20px',
                textAlign: 'left',
                fontSize: '0.75rem',
                opacity: 0.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
