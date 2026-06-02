import { useMemo } from 'react'

const HARD_CODED_RESULT_CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8']
const HARD_CODED_RESULT_SECTIONS = ['A', 'B', 'C']

export function useResultSearchOptions(selectedClass = '') {
  const classOptions = HARD_CODED_RESULT_CLASSES

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return []
    return HARD_CODED_RESULT_SECTIONS
  }, [selectedClass])

  return {
    classOptions,
    sectionOptions,
    loading: false,
    error: '',
  }
}

export default useResultSearchOptions
