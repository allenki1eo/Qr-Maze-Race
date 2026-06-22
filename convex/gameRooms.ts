import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    roomCode: v.string(),
    qrData: v.string(),
    mazeData: v.string(),
    hostId: v.string(),
    hostUsername: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('gameRooms', {
      roomCode: args.roomCode,
      qrData: args.qrData,
      mazeData: args.mazeData,
      hostId: args.hostId,
      hostUsername: args.hostUsername,
      hostPos: { x: 0, y: 0 },
      hostFinished: false,
      guestFinished: false,
      status: 'waiting',
    })
  },
})

export const getByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, { roomCode }) => {
    return ctx.db
      .query('gameRooms')
      .withIndex('by_roomCode', q => q.eq('roomCode', roomCode))
      .first()
  },
})

export const getById = query({
  args: { roomId: v.id('gameRooms') },
  handler: async (ctx, { roomId }) => {
    return ctx.db.get(roomId)
  },
})

export const join = mutation({
  args: {
    roomCode: v.string(),
    guestId: v.string(),
    guestUsername: v.string(),
  },
  handler: async (ctx, { roomCode, guestId, guestUsername }) => {
    const room = await ctx.db
      .query('gameRooms')
      .withIndex('by_roomCode', q => q.eq('roomCode', roomCode))
      .first()
    if (!room) throw new Error('Room not found')
    if (room.status !== 'waiting') throw new Error('Room is not open')
    if (room.guestId) throw new Error('Room is full')

    await ctx.db.patch(room._id, {
      guestId,
      guestUsername,
      guestPos: { x: 0, y: 0 },
      status: 'countdown',
    })
    return room._id
  },
})

export const startRace = mutation({
  args: { roomId: v.id('gameRooms') },
  handler: async (ctx, { roomId }) => {
    await ctx.db.patch(roomId, {
      status: 'racing',
      startTime: Date.now(),
    })
  },
})

export const updateHostPos = mutation({
  args: {
    roomId: v.id('gameRooms'),
    pos: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, { roomId, pos }) => {
    await ctx.db.patch(roomId, { hostPos: pos })
  },
})

export const updateGuestPos = mutation({
  args: {
    roomId: v.id('gameRooms'),
    pos: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, { roomId, pos }) => {
    await ctx.db.patch(roomId, { guestPos: pos })
  },
})

export const finishHost = mutation({
  args: { roomId: v.id('gameRooms') },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId)
    if (!room || room.status !== 'racing') return
    const now = Date.now()
    const time = room.startTime ? now - room.startTime : 0
    const isWinner = !room.guestFinished

    await ctx.db.patch(roomId, {
      hostFinished: true,
      hostTime: time,
      ...(isWinner
        ? { status: 'finished', winnerId: room.hostId, endTime: now }
        : { status: 'finished', endTime: now }),
    })
  },
})

export const finishGuest = mutation({
  args: { roomId: v.id('gameRooms') },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId)
    if (!room || room.status !== 'racing') return
    const now = Date.now()
    const time = room.startTime ? now - room.startTime : 0
    const isWinner = !room.hostFinished

    await ctx.db.patch(roomId, {
      guestFinished: true,
      guestTime: time,
      ...(isWinner
        ? { status: 'finished', winnerId: room.guestId, endTime: now }
        : { status: 'finished', endTime: now }),
    })
  },
})

export const listWaiting = query({
  args: {},
  handler: async ctx => {
    return ctx.db
      .query('gameRooms')
      .withIndex('by_status', q => q.eq('status', 'waiting'))
      .order('desc')
      .take(20)
  },
})
