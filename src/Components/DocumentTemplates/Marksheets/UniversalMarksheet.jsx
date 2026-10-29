import React from 'react'
import { useDocumentTemplates } from '../../../context/DocumentTemplateContext'
import OfficialStarPublicMarksheet from './OfficialStarPublicMarksheet'
import BiharBoardMarksheet from './BiharBoardMarksheet'
import ModernAcademicReportCard from './ModernAcademicReportCard'
import ClassicTableMarksheet from './ClassicTableMarksheet'
import PremiumBlueWhiteMarksheet from './PremiumBlueWhiteMarksheet'
import MinimalPrintMarksheet from './MinimalPrintMarksheet'

export default function UniversalMarksheet({
  templateId,
  student = {},
  marksData = {},
  customization: customOverrides,
  id,
}) {
  const { getActiveTemplateId, getCustomization } = useDocumentTemplates()

  const effectiveTemplateId = templateId || getActiveTemplateId('marksheet') || 'marksheet_official_star_public'
  const baseCustomization = getCustomization('marksheet') || {}
  const effectiveCustomization = { ...baseCustomization, ...(customOverrides || {}) }

  const props = {
    student,
    marksData,
    customization: effectiveCustomization,
    id,
  }

  switch (effectiveTemplateId) {
    case 'marksheet_bihar_board':
      return <BiharBoardMarksheet {...props} />
    case 'marksheet_modern_academic':
      return <ModernAcademicReportCard {...props} />
    case 'marksheet_classic_table':
      return <ClassicTableMarksheet {...props} />
    case 'marksheet_premium_blue_white':
      return <PremiumBlueWhiteMarksheet {...props} />
    case 'marksheet_minimal_print':
      return <MinimalPrintMarksheet {...props} />
    case 'marksheet_official_star_public':
    default:
      return <OfficialStarPublicMarksheet {...props} />
  }
}
