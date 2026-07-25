import { getCallHistory, createCall, updateCallStatus, getCallById, getMonthlyCallSecondsUsed } from '../db/queries/calls.js'
import { isProUser, FREE_CALL_SECONDS_PER_MONTH } from '../utils/plan.js'

export async function getCallUsage(req, res, next) {
  try {
    const isPro = isProUser(req.user)
    if (isPro) {
      return res.json({ isPro, usedSeconds: 0, limitSeconds: null, remainingSeconds: null })
    }
    const usedSeconds = await getMonthlyCallSecondsUsed(req.user.id)
    const remainingSeconds = Math.max(0, FREE_CALL_SECONDS_PER_MONTH - usedSeconds)
    res.json({ isPro, usedSeconds, limitSeconds: FREE_CALL_SECONDS_PER_MONTH, remainingSeconds })
  } catch (err) {
    next(err)
  }
}

export async function listCalls(req, res, next) {
  try {
    const calls = await getCallHistory(req.user.id)
    res.json({ calls })
  } catch (err) {
    next(err)
  }
}

export async function initiateCall(req, res, next) {
  try {
    const { calleeId, callType, conversationId } = req.body
    if (!calleeId || !callType) return res.status(400).json({ error: 'calleeId and callType required' })
    const call = await createCall({ callerId: req.user.id, calleeId, conversationId, callType })
    res.status(201).json({ call })
  } catch (err) {
    next(err)
  }
}

export async function endCall(req, res, next) {
  try {
    const { status, durationSeconds } = req.body
    const call = await updateCallStatus(req.params.id, status || 'answered', new Date(), durationSeconds)
    if (!call) return res.status(404).json({ error: 'Call not found' })
    res.json({ call })
  } catch (err) {
    next(err)
  }
}
