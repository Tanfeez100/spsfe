import React, { createContext, useContext, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const DraggableCardContext = createContext(null)

export const DraggableCardContainer = ({ className, children }) => {
  const containerRef = useRef(null)

  return (
    <DraggableCardContext.Provider value={{ containerRef }}>
      <div
        ref={containerRef}
        className={cn(
          'relative flex min-h-[500px] w-full items-center justify-center overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    </DraggableCardContext.Provider>
  )
}

export const DraggableCardBody = ({ className, children }) => {
  const context = useContext(DraggableCardContext)
  const [zIndex, setZIndex] = useState(15)

  return (
    <motion.div
      drag
      dragConstraints={context?.containerRef}
      dragElastic={0.2}
      whileTap={{ cursor: 'grabbing', scale: 1.05 }}
      whileDrag={{ scale: 1.07 }}
      onDragStart={() => setZIndex(60)}
      onDragEnd={() => setZIndex(25)}
      style={{ zIndex }}
      className={cn(
        'cursor-grab rounded-2xl bg-white p-3.5 shadow-xl border border-sky-100 select-none touch-none transition-shadow hover:shadow-2xl hover:border-sky-300',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
