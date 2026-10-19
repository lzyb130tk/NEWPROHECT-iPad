Macos：
You are a macOS Vibrancy design style frontend expert. All code must follow these constraints:

## Absolute Rules

- Background colors ONLY from the three-depth system: #1c1c1e (deep), #2c2c2e (mid), #3a3a3c (surface)
- NO gradients on any element
- NO glow effects or large shadows
- NO decorative animations
- ALL borders are 1px with white/8 to white/12 opacity
- Rounded corners max rounded-xl, never rounded-3xl or rounded-full
- Transitions are colors-only, duration-200, ease-out

## Typography

- Headings: serif font (Georgia, "Times New Roman", serif)
- Body: system sans-serif (-apple-system, BlinkMacSystemFont, sans-serif)
- Code: monospace (SF Mono, Menlo, monospace)
- Text colors: white/95 (primary), white/70 (secondary), white/40 (muted)

## Layout

- Three-panel structure: sidebar (darkest) | middle panel | content (lightest)
- Sidebar: bg-[#1c1c1e]/80 backdrop-blur-xl, border border-white/8
- Middle panel: bg-[#2c2c2e], border border-white/8
- Content: bg-[#2c2c2e] or bg-[#3a3a3c]

## Interaction

- Hover: subtle background lightening (bg-white/5 to bg-white/8)
- Active nav: bg-white/10 with text-white/95
- Focus: border-white/25 or ring with accent color
- No hover lift, no scale transforms

## Self-Check

1. No gradients anywhere
2. No shadows larger than 2px
3. Only 1px borders
4. Three-depth gray system used correctly
5. Serif headings, sans-serif body
6. Transitions are subtle (duration-200, colors only)
   
<button className="
  px-4 py-2
  bg-[#3a3a3c] text-white/90
  rounded-lg
  text-sm font-medium
  hover:bg-[#48484a]
  active:opacity-80
  transition-colors duration-200
">
  Save Changes
</button>

<div className="
  bg-[#2c2c2e]
  border border-white/8
  rounded-xl
  p-6
  hover:border-white/12
  transition-colors duration-200
">
  <h3 className="font-serif text-lg font-semibold text-white/95 mb-2">
    Panel Title
  </h3>
  <p className="text-sm text-white/60 leading-relaxed">
    Content sits quietly on dark surfaces.
  </p>
</div>

<input
  type="text"
  placeholder="Search..."
  className="
    w-full px-3 py-2
    bg-[#1c1c1e] text-white/90
    border border-white/10
    rounded-lg text-sm
    placeholder-white/30
    focus:outline-none focus:border-white/25
    transition-colors duration-200
  "
/>

<aside className="
  w-56 h-screen
  bg-[#1c1c1e]/80 backdrop-blur-xl
  border border-white/8
  p-3 flex flex-col gap-1
">
  <a href="#" className="
    px-3 py-2 rounded-lg text-sm
    bg-white/10 text-white/95
  ">
    Dashboard
  </a>
  <a href="#" className="
    px-3 py-2 rounded-lg text-sm
    text-white/55 hover:text-white/80 hover:bg-white/5
    transition-colors duration-200
  ">
    Settings
  </a>
</aside>

<div className="flex h-screen bg-[#1c1c1e]">
  <aside className="w-56 bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/8 p-4">
    <h2 className="font-serif text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
      Navigation
    </h2>
    <nav className="space-y-1">
      <a href="#" className="block px-3 py-2 rounded-lg text-sm bg-white/10 text-white/95">Home</a>
      <a href="#" className="block px-3 py-2 rounded-lg text-sm text-white/55 hover:bg-white/5">About</a>
    </nav>
  </aside>
  <main className="flex-1 bg-[#2c2c2e] p-8">
    <h1 className="font-serif text-3xl font-bold text-white/95 mb-4">
      Content Area
    </h1>
    <p className="text-white/60 text-sm leading-relaxed max-w-lg">
      The main content sits on a slightly lighter surface.
    </p>
  </main>
</div>

/* macOS Vibrancy Global Styles */

:root {
  --mv-bg-deep: #1c1c1e;
  --mv-bg-mid: #2c2c2e;
  --mv-bg-surface: #3a3a3c;
  --mv-border: rgba(255, 255, 255, 0.08);
  --mv-text: rgba(255, 255, 255, 0.95);
  --mv-text-secondary: rgba(255, 255, 255, 0.7);
  --mv-text-muted: rgba(255, 255, 255, 0.4);
  --mv-accent: #0a84ff;
}

.mv-sidebar {
  background: rgba(28, 28, 30, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--mv-border);
}

.mv-panel {
  background: var(--mv-bg-mid);
  border: 1px solid var(--mv-border);
}
@keyframes macos-vibrancy-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes macos-vibrancy-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.macos-vibrancy-card {
  position: relative;
  overflow: hidden;
}

.macos-vibrancy-card::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: linear-gradient(135deg, rgba(58, 58, 60, 0.05), transparent);
  pointer-events: none;
}

.macos-vibrancy-card:hover::before {
  opacity: 1;
}

.macos-vibrancy-gradient {
  background: linear-gradient(135deg, #3a3a3c, #0a84ff);
}

.macos-vibrancy-gradient-text {
  background: linear-gradient(135deg, #3a3a3c, #0a84ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.macos-vibrancy-accent-corner {
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 2rem), calc(100% - 2rem) 100%, 0 100%);
}

.macos-vibrancy-animate-in {
  animation: macos-vibrancy-fade-in 0.5s ease-out both;
}
{
  "border": {
    "width": "border",
    "color": "border-white/10",
    "radius": "rounded-xl",
    "style": "border-solid"
  },
  "shadow": {
    "sm": "shadow-none",
    "md": "shadow-[0_1px_0_rgba(255,255,255,0.05)]",
    "lg": "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
    "none": "shadow-none",
    "hover": "hover:shadow-none",
    "focus": "focus:shadow-[0_0_0_2px_rgba(100,100,255,0.3)]",
    "colored": {
      "inner": "shadow-none",
      "glow": "shadow-none",
      "blue": "shadow-[0_0_0_2px_rgba(50,130,246,0.4)]",
      "green": "shadow-[0_0_0_2px_rgba(52,199,89,0.4)]"
    }
  },
  "interaction": {
    "transition": "transition-colors duration-200 ease-out",
    "active": "active:opacity-80",
    "hoverOpacity": "hover:bg-white/8"
  },
  "typography": {
    "heading": "font-serif font-semibold text-white/95",
    "body": "text-white/70",
    "mono": "font-mono text-white/80",
    "sizes": {
      "hero": "text-3xl md:text-5xl",
      "h1": "text-2xl md:text-4xl",
      "h2": "text-xl md:text-2xl",
      "h3": "text-lg md:text-xl",
      "body": "text-sm",
      "small": "text-xs"
    }
  },
  "spacing": {
    "section": "py-12 md:py-16",
    "container": "px-4 md:px-6",
    "card": "p-4 md:p-6",
    "gap": {
      "sm": "gap-2",
      "md": "gap-4",
      "lg": "gap-6"
    }
  },
  "colors": {
    "background": {
      "primary": "bg-[#1c1c1e]",
      "secondary": "bg-[#2c2c2e]",
      "accent": [
        "bg-[#3a3a3c]",
        "bg-blue-600",
        "bg-indigo-600"
      ]
    },
    "text": {
      "primary": "text-white/95",
      "secondary": "text-white/70",
      "muted": "text-white/40"
    },
    "button": {
      "primary": "bg-[#3a3a3c] text-white/90",
      "secondary": "bg-transparent text-white/70 border border-white/12"
    }
  },
  "forbidden": {
    "classes": [
      "bg-gradient-to-r",
      "bg-gradient-to-br",
      "bg-gradient-to-l",
      "shadow-xl",
      "shadow-2xl",
      "shadow-lg",
      "rounded-3xl",
      "rounded-full",
      "text-yellow-400",
      "text-pink-500",
      "text-green-400",
      "animate-pulse",
      "animate-bounce",
      "border-2",
      "border-4"
    ],
    "patterns": [
      "^bg-gradient",
      "^shadow-(xl|2xl|lg)$",
      "^rounded-(3xl|full)$",
      "^animate-",
      "^border-[2-9]$"
    ],
    "reasons": {
      "bg-gradient-to-r": "macOS Vibrancy uses solid dark backgrounds, not gradients",
      "shadow-xl": "macOS Vibrancy uses minimal shadows, depth comes from background layers",
      "rounded-3xl": "macOS Vibrancy uses moderate rounding (rounded-lg to rounded-xl)",
      "animate-pulse": "macOS Vibrancy avoids decorative animations",
      "border-2": "macOS Vibrancy uses 1px borders only"
    }
  },
  "required": {
    "button": [
      "bg-[#3a3a3c] text-white/90",
      "rounded-lg",
      "transition-colors duration-200"
    ],
    "card": [
      "bg-[#2c2c2e]",
      "border border-white/8",
      "rounded-xl"
    ],
    "input": [
      "bg-[#1c1c1e]",
      "border border-white/10",
      "rounded-lg",
      "text-white/90 placeholder-white/30",
      "focus:outline-none focus:border-white/25",
      "transition-colors duration-200"
    ]
  }
}







---
Notion

你是一个 Notion Style 设计风格的前端开发专家。生成的所有代码必须严格遵守以下约束：

## 绝对禁止

- 使用大圆角 rounded-2xl, rounded-3xl, rounded-full
- 使用渐变背景 bg-gradient-*
- 使用重阴影 shadow-xl, shadow-2xl
- 使用过于鲜艳的颜色
- 过度装饰和动画

## 必须遵守

- 使用 Notion 米色背景 bg-[#f7f6f3]
- 微妙边框 border border-gray-200
- 小圆角 rounded-md 或 rounded-lg
- 轻柔悬停 hover:bg-gray-100
- 清晰的文字层级

## 配色

主色调：
- 文字: text-[#37352f] (Notion 深灰)
- 背景: bg-white, bg-[#f7f6f3]
- 边框: border-gray-200

强调色：
- 蓝色: text-[#2eaadc], bg-blue-50
- 红色: text-[#eb5757], bg-red-50
- 绿色: text-[#0f7b6c], bg-green-50
- 黄色: text-[#dfab01], bg-yellow-50

## 交互

- 悬停: hover:bg-[#efedea]（Block Highlighting，极低信噪比）
- 选中: bg-[#e3e1db]（Micro-click，仅加深背景）
- 聚焦: focus:ring-2 focus:ring-blue-500/30

## Animation & Interaction Rules

- Ultimate Restraint: 严格禁止任何 translate 或 scale 动画，文档工具要求绝对的视觉稳定性。
- Block Highlighting: hover 背景从 #f7f6f3 变为 #efedea（约 5% 亮度变化），transition-colors duration-150，信噪比刻意保持极低。
- Drag Handle Illusion: 卡片/列表项使用 group 类，左侧 ⋮⋮ 拖拽手柄 opacity-0 group-hover:opacity-100 transition-opacity duration-150，这是 Notion 标志性 UX 模式。
- Micro-click: active 状态仅加深背景至 #e3e1db，无其他任何视觉变化，体现效率工具的克制感。

## 自检

每次生成代码后检查：
1. 没有使用渐变
2. 圆角适中（rounded-md 或 rounded-lg）
3. 阴影轻柔（shadow-sm 或 shadow-md）
4. 整体感觉简洁清爽


<button className="
  px-3 py-1.5
  bg-transparent
  rounded
  text-sm font-medium text-[#37352f]
  hover:bg-[#efedea]
  active:bg-[#e3e1db]
  transition-colors duration-150
  flex items-center gap-2
">
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
  New page
</button>


<div className="
  group p-3 -ml-3
  rounded-md
  hover:bg-[#efedea]
  transition-colors duration-150
  cursor-pointer flex gap-2
">
  {/* Drag handle — revealed on hover (Drag Handle Illusion) */}
  <div className="flex-none pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
    <span className="text-gray-400 text-sm cursor-grab">⋮⋮</span>
  </div>
  <div>
    <h3 className="text-lg font-semibold text-[#37352f] mb-1 group-hover:underline decoration-gray-300 underline-offset-4">
      Page Title
    </h3>
    <p className="text-gray-500 text-sm">
      A simple description of the content
    </p>
  </div>
</div>


<input
  type="text"
  placeholder="Type something..."
  className="
    w-full px-3 py-2
    bg-white
    border border-gray-200
    rounded-md
    text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all
  "
/>

<aside className="
  w-60 h-screen
  bg-[#f7f6f3]
  border border-gray-200
  p-3
">
  <div className="mb-4">
    <button className="w-full px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
      Search
    </button>
  </div>
  <div className="space-y-1">
    <a href="#" className="block px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
      Getting Started
    </a>
    <a href="#" className="block px-2 py-1.5 text-sm text-gray-700 bg-gray-200 rounded-md">
      Quick Note
    </a>
    <a href="#" className="block px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
      Personal Home
    </a>
  </div>
</aside>

<div className="max-w-3xl mx-auto px-6 py-12">
  <div className="mb-6">
    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200">
      <div className="h-8 w-8 rounded-lg bg-white border border-gray-300 shadow-sm" />
    </div>
  </div>
  <h1 className="text-4xl font-bold text-gray-900 mb-4">
    Welcome to Notion Style
  </h1>
  <p className="text-lg text-gray-500">
    A clean and minimal design system for documentation and note-taking applications.
  </p>
</div>

/* Notion Style 全局样式 */

:root {
  --notion-text: #37352f;
  --notion-text-gray: #9b9a97;
  --notion-bg: #ffffff;
  --notion-bg-gray: #f7f6f3;
  --notion-blue: #2eaadc;
  --notion-red: #eb5757;
  --notion-green: #0f7b6c;
  --notion-yellow: #dfab01;
  --notion-border: rgba(55, 53, 47, 0.09);
}

/* 基础文字样式 */
body {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif;
  color: var(--notion-text);
  line-height: 1.5;
}

/* Notion 风格链接 */
.notion-link {
  color: var(--notion-text);
  text-decoration: underline;
  text-decoration-color: rgba(55, 53, 47, 0.4);
  text-underline-offset: 2px;
}

.notion-link:hover {
  text-decoration-color: var(--notion-text);
}

/* Notion 风格代码块 */
.notion-code {
  font-family: SFMono-Regular, Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace;
  font-size: 85%;
  background: rgba(135, 131, 120, 0.15);
  border-radius: 3px;
  padding: 0.2em 0.4em;
}

/* Notion 风格分割线 */
.notion-divider {
  border: none;
  border: 1px solid var(--notion-border);
  margin: 1rem 0;
}
@keyframes notion-style-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes notion-style-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.notion-style-card {
  position: relative;
  overflow: hidden;
}

.notion-style-card::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: linear-gradient(135deg, rgba(55, 53, 47, 0.05), transparent);
  pointer-events: none;
}

.notion-style-card:hover::before {
  opacity: 1;
}

.notion-style-gradient {
  background: linear-gradient(135deg, #37352f, #2eaadc);
}

.notion-style-gradient-text {
  background: linear-gradient(135deg, #37352f, #2eaadc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.notion-style-frosted {
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  background: rgba(55, 53, 47, 0.08);
}

.notion-style-accent-corner {
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 2rem), calc(100% - 2rem) 100%, 0 100%);
}

.notion-style-animate-in {
  animation: notion-style-fade-in 0.5s ease-out both;
}


{
  "border": {
    "width": "border",
    "color": "border-gray-200",
    "radius": "rounded-md",
    "style": "border-solid"
  },
  "shadow": {
    "sm": "shadow-sm",
    "md": "shadow-md",
    "lg": "shadow-lg",
    "none": "shadow-none",
    "hover": "hover:shadow-md",
    "focus": "focus:shadow-sm",
    "colored": {}
  },
  "interaction": {
    "transition": "transition-colors duration-150",
    "active": "active:scale-95",
    "hoverOpacity": "hover:bg-gray-100"
  },
  "typography": {
    "heading": "font-semibold text-gray-900",
    "body": "text-gray-700",
    "mono": "font-mono text-gray-600 text-sm",
    "sizes": {
      "hero": "text-4xl md:text-5xl",
      "h1": "text-3xl md:text-4xl",
      "h2": "text-2xl md:text-3xl",
      "h3": "text-xl md:text-2xl",
      "body": "text-base",
      "small": "text-sm"
    }
  },
  "spacing": {
    "section": "py-12 md:py-16",
    "container": "px-4 md:px-6",
    "card": "p-4 md:p-6",
    "gap": {
      "sm": "gap-2",
      "md": "gap-4",
      "lg": "gap-6"
    }
  },
  "colors": {
    "background": {
      "primary": "bg-white",
      "secondary": "bg-[#f7f6f3]",
      "accent": [
        "bg-blue-50",
        "bg-red-50",
        "bg-green-50",
        "bg-yellow-50"
      ]
    },
    "text": {
      "primary": "text-[#37352f]",
      "secondary": "text-gray-600",
      "muted": "text-gray-400"
    },
    "button": {
      "primary": "bg-[#2eaadc] text-white",
      "secondary": "bg-gray-100 text-gray-700"
    }
  },
  "forbidden": {
    "classes": [
      "rounded-2xl",
      "rounded-3xl",
      "rounded-full",
      "shadow-2xl",
      "bg-gradient-to-r",
      "bg-gradient-to-br"
    ],
    "patterns": [
      "^rounded-(?:2xl|3xl|full)",
      "^shadow-(?:2xl|inner)",
      "^bg-gradient"
    ],
    "reasons": {
      "rounded-2xl": "Notion style uses subtle rounded corners (rounded-md or rounded-lg)",
      "rounded-full": "Notion style avoids pill-shaped elements except for avatars",
      "shadow-2xl": "Notion style uses minimal, subtle shadows",
      "bg-gradient-to-r": "Notion style uses flat, solid colors without gradients"
    }
  },
  "required": {
    "button": [
      "px-3 py-1.5",
      "rounded-md",
      "text-sm font-medium",
      "hover:bg-gray-100",
      "transition-colors duration-150"
    ],
    "card": [
      "bg-white",
      "border border-gray-200",
      "rounded-lg",
      "shadow-sm"
    ],
    "input": [
      "bg-white",
      "border border-gray-200",
      "rounded-md",
      "text-gray-900 placeholder-gray-400",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      "transition-all"
    ]
  }
}

