import gql from 'graphql-tag'
import { useState, useEffect, useMemo } from 'react'
import { splitQuery } from 'utils/queries'
import { blockClient } from 'apollo/client'

export const GET_BLOCKS = (timestamps: string[]) => {
  let queryString = 'query blocks {'
  queryString += timestamps.map((timestamp) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
    } }) {
        number
      }`
  })
  queryString += '}'
  return gql(queryString)
}

const INITIAL_BLOCK = gql`
  query initialBlock {
    blocks(first: 1, orderBy: timestamp, orderDirection: asc) {
      number
      timestamp
    }
  }
`

/**
 * for a given array of timestamps, returns block entities
 * @param timestamps
 */
export function useBlocksFromTimestamps(
  timestamps: number[]
): {
  blocks:
    | {
        timestamp: string
        number: any
      }[]
    | undefined
  error: boolean
} {
  const [blocks, setBlocks] = useState<any>()
  const [error, setError] = useState(false)
  const [initialBlock, setInitialBlock] = useState<any>()

  useEffect(() => {
    async function fetchData() {
      const results = await splitQuery(GET_BLOCKS, blockClient, [], timestamps)
      if (results) {
        setBlocks(results)
      } else {
        setError(true)
      }
    }
    if (!blocks && !error) {
      fetchData()
    }
  })

  // Fetching first initial block that is indexed.
  useEffect(() => {
    const fetchInitialBlock = async () => {
      const { data } = await blockClient.query({
        query: INITIAL_BLOCK,
      })

      if (data) {
        setInitialBlock(data.blocks[0])
      }
    }

    fetchInitialBlock()
  }, [])

  const blocksFormatted = useMemo(() => {
    if (initialBlock && blocks) {
      const formatted = []
      for (const t in blocks) {
        if (blocks[t].length > 0) {
          // Check if no blocks returned for timestamp.
          formatted.push({
            timestamp: t.split('t')[1],
            number: blocks[t][0]['number'],
          })
        } else {
          // If no blocks returned for timestamp as it might be before indexing started.
          // Use and push the initial block that is indexed.
          formatted.push({
            timestamp: initialBlock.timestamp,
            number: initialBlock.number,
          })
        }
      }
      return formatted
    }
    return undefined
  }, [blocks, initialBlock])

  return {
    blocks: blocksFormatted,
    error,
  }
}

/**
 * @notice Fetches block objects for an array of timestamps.
 * @dev blocks are returned in chronological order (ASC) regardless of input.
 * @dev blocks are returned at string representations of Int
 * @dev timestamps are returns as they were provided; not the block time.
 * @param {Array} timestamps
 */
export async function getBlocksFromTimestamps(timestamps: number[], skipCount = 500) {
  if (timestamps?.length === 0) {
    return []
  }
  const fetchedData: any = await splitQuery(GET_BLOCKS, blockClient, [], timestamps, skipCount)

  const blocks: any[] = []
  if (fetchedData) {
    for (const t in fetchedData) {
      if (fetchedData[t].length > 0) {
        blocks.push({
          timestamp: t.split('t')[1],
          number: fetchedData[t][0]['number'],
        })
      }
    }
  }
  return blocks
}
