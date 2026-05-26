import React from 'react'
import WebsiteHeader from '../WebsiteHeader'
import WebsiteFooter from '../WebsiteFooter'

function WebsiteLayout({ children }) {
  return (
    <div className="gps-site min-h-screen text-slate-900">
      <WebsiteHeader />
      <main className="relative z-10 pb-16 pt-[122px] sm:pt-[132px] lg:pt-[138px]">{children}</main>
      <WebsiteFooter />
    </div>
  )
}

export default WebsiteLayout


