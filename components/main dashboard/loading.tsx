"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"

export default function Loading() {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer1 = setTimeout(() => setProgress(35), 300)
    const timer2 = setTimeout(() => setProgress(68), 800)
    const timer3 = setTimeout(() => setProgress(85), 1500)
    const timer4 = setTimeout(() => setProgress(98), 2000)

    return () => {
      [timer1, timer2, timer3, timer4].forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <motion.div 
        className="w-full max-w-md space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Progress value={progress} className="h-1" />
        <p className="text-center text-sm text-muted-foreground">
          Loading... {progress}%
        </p>
      </motion.div>
    </div>
  )
}

