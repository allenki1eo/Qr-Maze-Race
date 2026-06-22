import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  players: defineTable({
    username: v.string(),
    totalWins: v.number(),
    totalLosses: v.number(),
    bestTime: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_username', ['username']),

  gameRooms: defineTable({
    roomCode: v.string(),
    qrData: v.string(),
    mazeData: v.string(),
    hostId: v.string(),
    hostUsername: v.string(),
    guestId: v.optional(v.string()),
    guestUsername: v.optional(v.string()),
    hostPos: v.object({ x: v.number(), y: v.number() }),
    guestPos: v.optional(v.object({ x: v.number(), y: v.number() })),
    hostFinished: v.boolean(),
    guestFinished: v.boolean(),
    status: v.union(
      v.literal('waiting'),
      v.literal('countdown'),
      v.literal('racing'),
      v.literal('finished')
    ),
    winnerId: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    hostTime: v.optional(v.number()),
    guestTime: v.optional(v.number()),
  })
    .index('by_roomCode', ['roomCode'])
    .index('by_status', ['status'])
    .index('by_hostId', ['hostId']),

  leaderboard: defineTable({
    playerId: v.string(),
    username: v.string(),
    mazeId: v.string(),
    completionTime: v.number(),
    difficulty: v.string(),
    score: v.number(),
  })
    .index('by_score', ['score'])
    .index('by_playerId', ['playerId']),
})
