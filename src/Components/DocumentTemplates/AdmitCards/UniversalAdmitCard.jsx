import React from 'react'
import { useDocumentTemplates } from '../../../context/DocumentTemplateContext'
import ModernBlueHallTicket from './ModernBlueHallTicket'
import ClassicAdmitCard from './ClassicAdmitCard'
import FormalGovtAdmitCard from './FormalGovtAdmitCard'
import MinimalWhiteAdmitCard from './MinimalWhiteAdmitCard'
import PremiumBoxAdmitCard from './PremiumBoxAdmitCard'

export default function UniversalAdmitCard({
  templateId,
  student = {},
  timetable,
  customization: customOverrides,
  id,
}) {
  const { getActiveTemplateId, getCustomization } = useDocumentTemplates()

  const effectiveTemplateId = templateId || getActiveTemplateId('admit_card') || 'admit_card_modern_blue'
  const baseCustomization = getCustomization('admit_card') || {}
  const effectiveCustomization = { ...baseCustomization, ...(customOverrides || {}) }

  const props = {
    student,
    timetable,
    customization: effectiveCustomization,
    id,
  }

  switch (effectiveTemplateId) {
    case 'admit_card_classic':
      return <ClassicAdmitCard {...props} />
    case 'admit_card_formal_govt':
      return <FormalGovtAdmitCard {...props} />
    case 'admit_card_minimal_white':
      return <MinimalWhiteAdmitCard {...props} />
    case 'admit_card_premium_box':
      return <PremiumBoxAdmitCard {...props} />
    case 'admit_card_modern_blue':
    default:
      return <ModernBlueHallTicket {...props} />
  }
}
