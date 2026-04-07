// @zvndev/yable-react — CellStatusBadge
//
// Renders the error / conflict decoration over a cell when the commit
// coordinator marks it as `error` or `conflict`. Consumers can override
// the component via a slot prop on the table once that surface lands;
// for now this is the default rendering.

interface CellStatusBadgeBaseProps {
  onRetry: () => void
  onDismiss: () => void
}

interface ErrorProps extends CellStatusBadgeBaseProps {
  status: 'error'
  message: string | undefined
}

interface ConflictProps extends CellStatusBadgeBaseProps {
  status: 'conflict'
  conflictWith: unknown
}

export type CellStatusBadgeProps = ErrorProps | ConflictProps

export function CellStatusBadge(props: CellStatusBadgeProps) {
  if (props.status === 'error') {
    return (
      <span
        className="yable-cell-status-badge yable-cell-status-badge--error"
        role="status"
        aria-label={`Save failed: ${props.message ?? 'unknown error'}`}
        title={props.message}
      >
        <button
          type="button"
          className="yable-cell-status-badge__retry"
          onClick={(e) => {
            e.stopPropagation()
            props.onRetry()
          }}
          aria-label="Retry save"
        >
          ↻
        </button>
        <button
          type="button"
          className="yable-cell-status-badge__dismiss"
          onClick={(e) => {
            e.stopPropagation()
            props.onDismiss()
          }}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </span>
    )
  }

  // conflict
  return (
    <span
      className="yable-cell-status-badge yable-cell-status-badge--conflict"
      role="status"
      aria-label={`Conflict: server has ${String(props.conflictWith)}`}
      title={`Server value: ${String(props.conflictWith)}`}
    >
      <button
        type="button"
        className="yable-cell-status-badge__accept-mine"
        onClick={(e) => {
          e.stopPropagation()
          props.onRetry()
        }}
        aria-label="Keep my change"
      >
        ✓
      </button>
      <button
        type="button"
        className="yable-cell-status-badge__accept-theirs"
        onClick={(e) => {
          e.stopPropagation()
          props.onDismiss()
        }}
        aria-label="Accept server value"
      >
        ✗
      </button>
    </span>
  )
}
