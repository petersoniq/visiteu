import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Potvrdenie/odmietnutie návštevy, ktorú niekto zdieľal ako spolucestujúci
 * (pozri `mirror_visit_for_companion` a trigger `on_visit_declined_cleanup`).
 * Odmietnutie len nastaví `participant_status = 'declined'` - samotné zmazanie
 * riadku spraví DB trigger, frontend sa o to nemusí starať.
 */
export function useVisitParticipation() {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(visitId: string, status: 'confirmed' | 'declined') {
    setProcessingId(visitId)
    setError(null)

    const { error: dbError } = await supabase
      .from('visits')
      .update({ participant_status: status })
      .eq('id', visitId)

    setProcessingId(null)

    if (dbError) {
      setError(dbError.message)
      return false
    }
    return true
  }

  return {
    processingId,
    error,
    confirmVisit: (visitId: string) => updateStatus(visitId, 'confirmed'),
    declineVisit: (visitId: string) => updateStatus(visitId, 'declined'),
  }
}
