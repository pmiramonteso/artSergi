// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    // Prettier owns formatting of void elements (<img />, <br />).
    'vue/html-self-closing': ['warn', { html: { void: 'any' } }],
  },
})
