import { getCallHistory, createCall, updateCallStatus, getCallById } from '../db/queries/calls.js'

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
