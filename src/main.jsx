import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import schoolLogo from './assets/logo.png'

const faviconElement =
  document.querySelector("link[rel='icon']") ||
  (() => {
    const link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
    return link
  })()

faviconElement.type = 'image/jpeg'
faviconElement.href = schoolLogo

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unknown error',
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled app error:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-4">
        <div className="gps-card w-full max-w-lg p-6">
          <h1 className="text-xl font-bold text-white">Application crashed</h1>
          <p className="mt-2 text-sm text-slate-300">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="gps-button mt-4"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}

import { DocumentTemplateProvider } from './context/DocumentTemplateContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <DocumentTemplateProvider>
        <App />
      </DocumentTemplateProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
