import type { Preview } from '@storybook/react'
import '@zvndev/yable-themes/default.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
