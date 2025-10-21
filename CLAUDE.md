# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify theme based on the **Horizon** theme (v3.0.1). It's a custom implementation for spain-store-main.myshopify.com. The theme uses modern web components architecture with Liquid templating, custom JavaScript components, and CSS.

## Development Commands

```bash
# Start local development server
npm run dev

# Push changes to Shopify store
npm run push

# Pull latest changes from Shopify store
npm run pull
```

Store connection details are configured in package.json for `spain-store-main.myshopify.com` (theme ID: 149090992299).

## Architecture Overview

### Component System

The theme uses a custom web component architecture built on the `Component` base class (assets/component.js):

- **Base Class**: `Component` extends `DeclarativeShadowElement`
- **Ref System**: Components use `ref` attributes to create references to child elements. Arrays can be created using `ref="name[]"` syntax.
- **Event Handling**: Declarative event listeners using `on:eventname` attributes (e.g., `on:click`, `on:change`)
- **Event Delegation**: Supports component method calls via attributes like `on:click="closest-selector/methodName"` or `on:click="#component-id/methodName"`
- **Data Passing**: Supports passing data to event handlers using query string (`?key=value`) or direct value (`/value`) syntax

### Directory Structure

```
├── assets/          # JavaScript, CSS, and static assets
│   ├── *.js        # Web components and utilities
│   ├── *.css       # Stylesheets
│   └── global.d.ts # TypeScript type definitions
├── blocks/         # Reusable theme blocks (both public and internal)
│   ├── *.liquid    # Public blocks (no underscore prefix)
│   └── _*.liquid   # Internal/private blocks (underscore prefix)
├── config/         # Theme configuration
│   ├── settings_schema.json  # Theme settings definition
│   └── settings_data.json    # Current theme settings values
├── layout/         # Theme layouts
│   ├── theme.liquid     # Main layout
│   └── password.liquid  # Password page layout
├── locales/        # Translation files (JSON and schema files for 30+ languages)
├── sections/       # Theme sections
│   ├── *.liquid         # Regular sections
│   ├── _*.liquid        # Utility sections (e.g., _blocks.liquid)
│   ├── header-group.json
│   └── footer-group.json
├── snippets/       # Reusable Liquid snippets
└── templates/      # Page templates (JSON format)
```

### Liquid Template Architecture

- **Sections**: Composed of blocks and use the `content_for 'blocks'` pattern
- **Blocks**: Use the `content_for 'block'` pattern to render individual blocks
- **Snippets**: Reusable components rendered via `{% render 'snippet-name' %}`
- **Internal Patterns**: Files prefixed with `_` are internal/private (e.g., `_blocks.liquid`, `_heading.liquid`)

### CSS Architecture

- **Mobile-First**: Always design and write CSS for mobile first, then add desktop styles
- **Color Schemes**: Dynamic color schemes via CSS custom properties (see snippets/color-schemes.liquid)
- **Spacing System**: Uses CSS custom properties for spacing (--padding-*, --gap-*, --margin-*)
- **Section Styling**: Common patterns like `spacing-style`, `section--full-width-margin`, `section--page-width`

### JavaScript Architecture

- **Module System**: ES6 modules with imports from `@theme/` alias
- **Component Lifecycle**:
  - `connectedCallback()`: Element connected to DOM
  - `updatedCallback()`: Re-rendered via Section Rendering API
  - `disconnectedCallback()`: Element disconnected from DOM
- **Utilities**: Common utilities in assets/utilities.js
- **Section Hydration**: Uses section-hydration.js for dynamic section updates
- **View Transitions**: Built-in support via view-transitions.js

## Important Conventions

### Logging
- **Always use `console.log()` for debugging**, never use logger utilities

### Images
- **Use `image_url` filter instead of deprecated `img_url`**
  ```liquid
  {{ settings.logo | image_url: width: 500 }}
  ```

### TypeScript
- After making changes to TypeScript files, check for type errors
- Type definitions are in assets/global.d.ts

### Header Architecture

The header (sections/header.liquid) is highly configurable with:
- **Transparent Header**: Can be enabled per template (home, product, collection)
- **Sticky Header**: Supports "always", "scroll-up", or "never" modes
- **Two-Row Layout**: Top and bottom rows with configurable element positioning
- **Dynamic Ordering**: Logo, menu, search, localization, and actions can be positioned flexibly

### Section Rendering

Sections use the Shopify Section Rendering API:
- Sections are hydrated via `section-hydration.js`
- URL changes trigger section updates without full page reload
- Mutation observers track DOM changes and update component refs

### MCP Shopify Dev Server

To add the Shopify dev MCP server globally:
```bash
claude mcp add shopify-dev -- npx -y @shopify/dev-mcp@latest
```

## Common Patterns

### Creating a New Section
1. Create a `.liquid` file in `sections/`
2. Add schema at the bottom with settings and blocks
3. Use `{% render 'section', section: section, children: children %}` pattern
4. For block-based sections, use `{% content_for 'blocks' %}` to render blocks

### Creating a New Block
1. Create a `.liquid` file in `blocks/` (prefix with `_` if internal)
2. Use `content_for 'block'` to access block properties
3. Define block schema in the parent section

### Adding Event Handlers
```liquid
<button on:click="methodName">Click me</button>
<!-- Or with component selector -->
<button on:click="my-component/methodName">Click me</button>
<!-- Or with data -->
<button on:click="methodName?key=value">Click me</button>
```

### Using Refs
```liquid
<div ref="container">
  <button ref="buttons[]">Button 1</button>
  <button ref="buttons[]">Button 2</button>
</div>
```

```javascript
// Access in component
this.refs.container      // Single element
this.refs.buttons        // Array of elements
```

## Theme Customization

- Theme name: Horizon
- Store: spain-store-main.myshopify.com
- Theme supports 30+ languages with full localization
- Color schemes are fully customizable via theme settings
- Supports customer accounts, search, localization, and cart features
