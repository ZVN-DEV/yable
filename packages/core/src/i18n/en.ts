// @zvndev/yable-core — Default English Locale

export interface YableLocale {
  // Pagination
  paginationOf: string
  paginationRows: string
  paginationNoResults: string
  paginationFirstPage: string
  paginationLastPage: string
  paginationPreviousPage: string
  paginationNextPage: string
  paginationPage: string

  // Search / Filter
  searchPlaceholder: string
  searchAriaLabel: string
  filterEquals: string
  filterContains: string
  filterStartsWith: string
  filterEndsWith: string
  filterEmpty: string
  filterNotEmpty: string
  filterBetween: string
  clearFilter: string
  clearAllFilters: string

  // Sorting
  sortAscending: string
  sortDescending: string
  sortClear: string

  // Selection
  selectAll: string
  selectRow: string
  selectedCount: string

  // Column menu
  columnMenuPin: string
  columnMenuPinLeft: string
  columnMenuPinRight: string
  columnMenuUnpin: string
  columnMenuHide: string
  columnMenuAutoSize: string
  columnMenuResetSize: string

  // Context menu
  contextMenuCopy: string
  contextMenuCut: string
  contextMenuPaste: string
  contextMenuExport: string
  contextMenuExportCsv: string
  contextMenuExportJson: string

  // Status bar
  statusBarTotal: string
  statusBarFiltered: string
  statusBarSelected: string

  // Empty states
  emptyNoData: string
  emptyNoResults: string
  emptyNoDataDetail: string
  emptyNoResultsDetail: string

  // Loading
  loadingText: string

  // Sidebar
  sidebarColumns: string
  sidebarFilters: string
  sidebarSearchColumns: string
  sidebarShowAll: string
  sidebarHideAll: string

  // Print
  printTitle: string

  // Misc
  close: string
  apply: string
  cancel: string
  reset: string
}

export const en: YableLocale = {
  // Pagination
  paginationOf: 'of',
  paginationRows: 'rows',
  paginationNoResults: 'No results',
  paginationFirstPage: 'First page',
  paginationLastPage: 'Last page',
  paginationPreviousPage: 'Previous page',
  paginationNextPage: 'Next page',
  paginationPage: 'Page',

  // Search / Filter
  searchPlaceholder: 'Search...',
  searchAriaLabel: 'Search table',
  filterEquals: 'Equals',
  filterContains: 'Contains',
  filterStartsWith: 'Starts with',
  filterEndsWith: 'Ends with',
  filterEmpty: 'Is empty',
  filterNotEmpty: 'Is not empty',
  filterBetween: 'Between',
  clearFilter: 'Clear filter',
  clearAllFilters: 'Clear all filters',

  // Sorting
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  sortClear: 'Clear sort',

  // Selection
  selectAll: 'Select all',
  selectRow: 'Select row',
  selectedCount: 'selected',

  // Column menu
  columnMenuPin: 'Pin column',
  columnMenuPinLeft: 'Pin left',
  columnMenuPinRight: 'Pin right',
  columnMenuUnpin: 'Unpin',
  columnMenuHide: 'Hide column',
  columnMenuAutoSize: 'Auto-size',
  columnMenuResetSize: 'Reset size',

  // Context menu
  contextMenuCopy: 'Copy',
  contextMenuCut: 'Cut',
  contextMenuPaste: 'Paste',
  contextMenuExport: 'Export',
  contextMenuExportCsv: 'Export as CSV',
  contextMenuExportJson: 'Export as JSON',

  // Status bar
  statusBarTotal: 'Total',
  statusBarFiltered: 'Filtered',
  statusBarSelected: 'Selected',

  // Empty states
  emptyNoData: 'No data',
  emptyNoResults: 'No results found',
  emptyNoDataDetail: 'There are no rows to display.',
  emptyNoResultsDetail: 'Try adjusting your search or filter criteria.',

  // Loading
  loadingText: 'Loading...',

  // Sidebar
  sidebarColumns: 'Columns',
  sidebarFilters: 'Filters',
  sidebarSearchColumns: 'Search columns...',
  sidebarShowAll: 'Show all',
  sidebarHideAll: 'Hide all',

  // Print
  printTitle: 'Print',

  // Misc
  close: 'Close',
  apply: 'Apply',
  cancel: 'Cancel',
  reset: 'Reset',
}
