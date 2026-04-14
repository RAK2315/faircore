import { useState, useCallback, useRef, useEffect } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'

interface TextScrambleProps {
  text: string
  className?: string
  autoPlay?: boolean
  delay?: number
}

export function TextScramble({ text, className = '', autoPlay = false, delay = 0 }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(autoPlay ? '' : text)
  const [isHovering, setIsHovering] = useState(false)
  const [isScrambling, setIsScrambling] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameRef = useRef(0)

  const scramble = useCallback(() => {
    setIsScrambling(true)
    frameRef.current = 0
    const duration = text.length * 3

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      frameRef.current++
      const progress = frameRef.current / duration
      const revealedLength = Math.floor(progress * text.length)

      const newText = text
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' '
          if (i < revealedLength) return text[i]
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplayText(newText)

      if (frameRef.current >= duration) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setDisplayText(text)
        setIsScrambling(false)
      }
    }, 30)
  }, [text])

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(scramble, delay)
      return () => clearTimeout(t)
    }
  }, [autoPlay, delay, scramble])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <span
      className={`cursor-pointer select-none ${className}`}
      onMouseEnter={() => { setIsHovering(true); scramble() }}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText.split('').map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-all duration-75 ${
            isScrambling && char !== text[i] ? 'text-fc-yellow' : ''
          }`}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
