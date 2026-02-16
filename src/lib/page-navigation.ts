export type AppPage = 'home' | 'calendar' | 'settings'

const PAGE_SEQUENCE: readonly AppPage[] = ['home', 'calendar', 'settings']

export function getPageForSwipe(
  currentPage: AppPage,
  direction: 'left' | 'right'
): AppPage | null {
  const currentIndex = PAGE_SEQUENCE.indexOf(currentPage)
  if (currentIndex < 0) {
    return null
  }

  const nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1
  const nextPage = PAGE_SEQUENCE[nextIndex]

  return nextPage ?? null
}
