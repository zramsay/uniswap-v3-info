import { useEffect, useState } from 'react'
import { getCurrentTimestamp } from 'utils'

export default function useCurrentTimestamp() {
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date().getTime())

  // Set currentTimestamp.
  useEffect(() => {
    async function fetchTimestamp() {
      const timestamp = await getCurrentTimestamp()
      setCurrentTimestamp(timestamp)
    }

    fetchTimestamp()
  }, [])

  return currentTimestamp
}
