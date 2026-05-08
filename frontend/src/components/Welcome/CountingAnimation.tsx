import React, { useState, useEffect, useRef } from 'react'
import { Typography, TypographyProps } from '@mui/material'

interface CountingAnimationProps extends Omit<TypographyProps, 'children'> {
  end: number
  start?: number
  duration?: number
  suffix?: string
  prefix?: string
  separator?: string
  decimals?: number
}

const CountingAnimation: React.FC<CountingAnimationProps> = ({
  end,
  start = 0,
  duration = 2000,
  suffix = '',
  prefix = '',
  separator = ',',
  decimals = 0,
  ...typographyProps
}) => {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const countRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.5,
      }
    )

    if (countRef.current) {
      observer.observe(countRef.current)
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current)
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const startValue = start
    const endValue = end
    const totalChange = endValue - startValue

    const animateCount = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (totalChange * easeOut)

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animateCount)
      } else {
        setCount(endValue)
      }
    }

    requestAnimationFrame(animateCount)
  }, [isVisible, start, end, duration])

  const formatNumber = (num: number) => {
    const rounded = decimals > 0 ? num.toFixed(decimals) : Math.floor(num).toString()
    
    if (separator && num >= 1000) {
      return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    }
    
    return rounded
  }

  return (
    <Typography
      ref={countRef}
      {...typographyProps}
    >
      {prefix}{formatNumber(count)}{suffix}
    </Typography>
  )
}

export default CountingAnimation