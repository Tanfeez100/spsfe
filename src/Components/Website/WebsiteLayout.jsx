import React from 'react'
import WebsiteHeader from '../WebsiteHeader'
import WebsiteFooter from '../WebsiteFooter'

function WebsiteLayout({ children }) {
  return (
    <div className="gps-site flex h-screen flex-col overflow-hidden text-slate-900">
      <WebsiteHeader />
      <div
        id="website-scroll-container"
        data-route-scroll-container="true"
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <main className="relative z-10">{children}</main>
        <WebsiteFooter />
      </div>
    </div>
  )
}

export default WebsiteLayout


