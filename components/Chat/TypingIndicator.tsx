"use client"

import { useState, useEffect, type FC } from "react"
import Image from "next/image"

interface TypingIndicatorProps {
  userImage?: string
}

export const TypingIndicator: FC<TypingIndicatorProps> = ({ userImage }) => {
  const [dotPattern, setDotPattern] = useState(0)

  useEffect(() => {
    //const patterns = ["...", "..", "."]
    const interval = setInterval(() => {
      setDotPattern((prev) => (prev + 1) % patterns.length)
    }, 500) // 500ms delay between each pattern change

    return () => clearInterval(interval)
  }, [])

  const patterns = ["....", "...", "..", "."]

  return (
    <div className="flex items-center gap-2 my-2">
      {userImage && (
        <div className="w-8 h-8 relative rounded-full overflow-hidden mx-2">
          <Image
            src={userImage || "/placeholder.svg"}
            alt="User typing"
            width={32}
            height={32}
            className="object-cover"
          />
        </div>
      )}
      <div className="">
        <p className="italic">typing{patterns[dotPattern]}</p>
      </div>
    </div>
  )
}

