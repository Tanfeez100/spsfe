import React from 'react'
import { useDocumentTemplates } from '../../../context/DocumentTemplateContext'
import ModernBlueIdCard from './ModernBlueIdCard'
import ClassicWhiteIdCard from './ClassicWhiteIdCard'
import PremiumGradientIdCard from './PremiumGradientIdCard'
import CompactVerticalIdCard from './CompactVerticalIdCard'
import SmartIdentityIdCard from './SmartIdentityIdCard'
import RoyalPrestigeIdCard from './RoyalPrestigeIdCard'
import ModernTechDualToneIdCard from './ModernTechDualToneIdCard'
import EliteClassicIdCard from './EliteClassicIdCard'

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
    case 'id_card_royal_prestige':
      return <RoyalPrestigeIdCard {...props} />
    case 'id_card_modern_tech':
      return <ModernTechDualToneIdCard {...props} />
    case 'id_card_elite_classic':
      return <EliteClassicIdCard {...props} />
    case 'id_card_classic_white':
      return <ClassicWhiteIdCard {...props} />
    case 'id_card_premium_gradient':
      return <PremiumGradientIdCard {...props} />
    case 'id_card_compact_vertical':
      return <CompactVerticalIdCard {...props} />
    case 'id_card_smart_identity':
      return <SmartIdentityIdCard {...props} />
    case 'id_card_modern_blue':
    default:
      return <ModernBlueIdCard {...props} />
  }
}

