import React from 'react'
import { useDocumentTemplates } from '../../../context/DocumentTemplateContext'
import ModernBlueIdCard from './ModernBlueIdCard'
import RoseGoldBlossomIdCard from './RoseGoldBlossomIdCard'
import NavyWaveTechIdCard from './NavyWaveTechIdCard'
import CrimsonArchClassicIdCard from './CrimsonArchClassicIdCard'

export default function UniversalIdCard({
  templateId,
  student = {},
  customization: customOverrides,
  scale = 1,
  id,
}) {
  const { getActiveTemplateId, getCustomization } = useDocumentTemplates()

  const effectiveTemplateId = templateId || getActiveTemplateId('id_card') || 'id_card_modern_blue'
  const baseCustomization = getCustomization('id_card') || {}
  const effectiveCustomization = { ...baseCustomization, ...(customOverrides || {}) }

  const props = {
    student,
    customization: effectiveCustomization,
    scale,
    id,
  }

  switch (effectiveTemplateId) {
    case 'id_card_rose_gold':
      return <RoseGoldBlossomIdCard {...props} />
    case 'id_card_navy_wave':
      return <NavyWaveTechIdCard {...props} />
    case 'id_card_crimson_arch':
      return <CrimsonArchClassicIdCard {...props} />
    case 'id_card_modern_blue':
    default:
      return <ModernBlueIdCard {...props} />
  }
}
