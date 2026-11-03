export type SearchMode = 'web' | 'document' | 'hybrid'

export type SelectedSearchMode = 'auto' | SearchMode

export interface SearchModeDecision {
  mode: SearchMode
  reason: string
}