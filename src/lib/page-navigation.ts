export type AppPage = 'home' | 'calendar' | 'settings'

const PAGE_SEQUENCE: readonly AppPage[] = ['home', 'calendar', 'settings']

export function isAppPage(value: string | null): value is AppPage {
  return value === 'home' || value === 'calendar' || value === 'settings'
}

export function getPageFromSearch(search: string): AppPage {
  const page = new URLSearchParams(search).get('page')
  return isAppPage(page) ? page : 'home'
}

export function getUrlForPage(page: AppPage, currentUrl: string): string {
  const url = new URL(currentUrl)
  if (page === 'home') {
    url.searchParams.delete('page')
  } else {
    url.searchParams.set('page', page)
  }
  return `${url.pathname}${url.search}${url.hash}`
}

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
