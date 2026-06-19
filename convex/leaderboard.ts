import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

function calcScore(timeMs: number, difficulty: string): number {
  const base = 10000
  const timePenalty = Math.floor(timeMs / 1000) * 10
  const multiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1
  return Math.max(0, (base - timePenalty) * multiplier)
}

export const submit = mutation({
  args: {
    playerId: v.string(),
    username: v.string(),
    mazeId: v.string(),
    completionTime: v.number(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const score = calcScore(args.completionTime, args.difficulty)
    return ctx.db.insert('leaderboard', { ...args, score })
  },
})

export const getTop = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return ctx.db
      .query('leaderboard')
      .withIndex('by_score')
      .order('desc')
      .take(limit)
  },
})

export const getByPlayer = query({
  args: { playerId: v.string() },
  handler: async (ctx, { playerId }) => {
    return ctx.db
      .query('leaderboard')
      .withIndex('by_playerId', q => q.eq('playerId', playerId))
      .order('desc')
      .take(10)
  },
})
