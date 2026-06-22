import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getOrCreate = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const existing = await ctx.db
      .query('players')
      .withIndex('by_username', q => q.eq('username', username))
      .first()
    if (existing) return existing._id
    return ctx.db.insert('players', {
      username,
      totalWins: 0,
      totalLosses: 0,
      createdAt: Date.now(),
    })
  },
})

export const get = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, { playerId }) => {
    return ctx.db.get(playerId)
  },
})

export const recordWin = mutation({
  args: { playerId: v.id('players'), time: v.number() },
  handler: async (ctx, { playerId, time }) => {
    const player = await ctx.db.get(playerId)
    if (!player) return
    await ctx.db.patch(playerId, {
      totalWins: player.totalWins + 1,
      bestTime: player.bestTime === undefined ? time : Math.min(player.bestTime, time),
    })
  },
})

export const recordLoss = mutation({
  args: { playerId: v.id('players') },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId)
    if (!player) return
    await ctx.db.patch(playerId, { totalLosses: player.totalLosses + 1 })
  },
})
