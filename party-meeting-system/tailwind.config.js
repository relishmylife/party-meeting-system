/**
 * 党组织生活会议管理系统 - Tailwind CSS 主题配置
 * 基于内蒙古科技大学官网配色方案（红-金-白）
 * 版本: v1.0
 * 更新时间: 2025-11-29
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ========== 色彩系统 ==========
      colors: {
        // 主色调 - 红色系统
        primary: {
          50: '#FEF2F2',   // 淡红背景、悬停状态
          100: '#FEE2E2',  // 标签、徽章背景
          500: '#C8102E',  // 品牌红 - 主按钮、主要链接 (WCAG 5.8:1)
          600: '#A50D25',  // 按钮悬停、激活状态 (WCAG 7.2:1)
          700: '#8B0A1F',  // 导航栏背景、深色区域 (WCAG 9.8:1)
          800: '#6E081A',  // 辅助导航背景 - 酒红色 (WCAG 12.5:1)
          900: '#4A0511',  // 极深红色、页脚背景 (WCAG 15.2:1)
          DEFAULT: '#A50D25',
          foreground: '#FFFFFF',
        },

        // 强调色 - 金色系统
        accent: {
          50: '#FFFBEB',   // 金色背景淡化
          100: '#FEF3C7',  // 提示背景
          400: '#FBBF24',  // 金色文字（浅背景）
          500: '#F59E0B',  // 橙金色 - 核心强调、重要通知
          600: '#D97706',  // 深金色 - 金色按钮、徽章
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },

        // 次要色 - 使用金色
        secondary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },

        // 中性色系统
        neutral: {
          50: '#FAFAFA',   // 页面主背景
          100: '#F5F5F5',  // 卡片背景
          200: '#E5E5E5',  // 分割线、边框
          300: '#D4D4D4',  // 输入框边框
          400: '#A3A3A3',  // 占位符文字
          500: '#737373',  // 次要信息文字
          600: '#525252',  // 副标题文字
          700: '#404040',  // 主要文字 (WCAG 10.4:1)
          800: '#262626',  // 标题文字 (WCAG 14.2:1)
          900: '#171717',  // 深色文字、深色模式背景
        },

        // 语义色系统
        success: '#16A34A',  // 成功状态、完成标识
        warning: '#F59E0B',  // 警告提示（复用金色）
        error: '#DC2626',    // 错误提示、删除操作
        info: '#2563EB',     // 信息提示、帮助说明
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },

        // 背景色
        background: '#FAFAFA',
        foreground: '#262626',
        
        // 边框和分割线
        border: '#E5E5E5',
        input: '#D4D4D4',
        ring: '#C8102E',

        // 卡片
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#262626',
        },

        // Popover
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#262626',
        },

        // Muted
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#737373',
        },
      },

      // ========== 字体系统 ==========
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },

      fontSize: {
        'xs': '12px',   // 徽章、标签
        'sm': '14px',   // 次要信息
        'base': '16px', // 正文
        'lg': '18px',   // 副标题
        'xl': '20px',   // 系统标题
        '2xl': '24px',  // 卡片标题
        '3xl': '28px',  // 欢迎标题
        '4xl': '32px',  // 页面主标题
        '5xl': '36px',  // 统计数字
      },

      fontWeight: {
        normal: '400',    // 常规
        medium: '500',    // 中等 - 按钮文字
        semibold: '600',  // 半粗 - 副标题、导航
        bold: '700',      // 粗体 - 标题、统计数字
      },

      lineHeight: {
        tight: '1.25',    // 紧凑 - 标题
        normal: '1.5',    // 正常 - 正文
        relaxed: '1.625', // 宽松 - 长文本
      },

      // ========== 间距系统 (4pt网格) ==========
      spacing: {
        '0': '0px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },

      // ========== 圆角系统 ==========
      borderRadius: {
        'none': '0px',
        'sm': '4px',     // 徽章
        'DEFAULT': '8px', // 按钮、输入框、标签
        'md': '8px',
        'lg': '12px',    // 卡片、横幅
        'xl': '16px',
        '2xl': '20px',
        'full': '9999px', // 圆形头像
      },

      // ========== 阴影系统 ==========
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'button-primary': '0 2px 4px rgba(200, 16, 46, 0.2)',
        'button-primary-hover': '0 4px 8px rgba(200, 16, 46, 0.3)',
        'focus': '0 0 0 4px rgba(200, 16, 46, 0.1)',
      },

      // ========== 动画系统 ==========
      transitionDuration: {
        'fast': '200ms',    // 快速反馈 - 按钮、链接
        'DEFAULT': '300ms', // 标准过渡 - 卡片、下拉
        'slow': '500ms',    // 大型元素 - 模态框
      },

      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',         // 按钮、链接
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',   // 模态框、抽屉
      },

      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
