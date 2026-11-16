export const scrollToPageTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  if (typeof document !== 'undefined') {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    document
      .querySelectorAll('[data-route-scroll-container="true"], #website-scroll-container')
      .forEach((node) => {
        if (typeof node.scrollTo === 'function') {
          node.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        } else {
          node.scrollTop = 0
          node.scrollLeft = 0
        }
      })
  }
}

export default scrollToPageTop
