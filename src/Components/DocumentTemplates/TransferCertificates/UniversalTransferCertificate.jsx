import React from 'react'
import { useDocumentTemplates } from '../../../context/DocumentTemplateContext'
import TraditionalOfficialTc from './TraditionalOfficialTc'
import ModernFormalTc from './ModernFormalTc'
import ElegantBorderTc from './ElegantBorderTc'
import MinimalProfessionalTc from './MinimalProfessionalTc'
import PremiumInstitutionalTc from './PremiumInstitutionalTc'

export default function UniversalTransferCertificate({
  templateId,
  student = {},
  tcData = {},
  customization: customOverrides,
  id,
}) {
  const { getActiveTemplateId, getCustomization } = useDocumentTemplates()

  const effectiveTemplateId = templateId || getActiveTemplateId('transfer_certificate') || 'tc_traditional_official'
  const baseCustomization = getCustomization('transfer_certificate') || {}
  const effectiveCustomization = { ...baseCustomization, ...(customOverrides || {}) }

  const props = {
    student,
    tcData,
    customization: effectiveCustomization,
    id,
  }

  switch (effectiveTemplateId) {
    case 'tc_modern_formal':
      return <ModernFormalTc {...props} />
    case 'tc_elegant_border':
      return <ElegantBorderTc {...props} />
    case 'tc_minimal_professional':
      return <MinimalProfessionalTc {...props} />
    case 'tc_premium_institutional':
      return <PremiumInstitutionalTc {...props} />
    case 'tc_traditional_official':
    default:
      return <TraditionalOfficialTc {...props} />
  }
}
