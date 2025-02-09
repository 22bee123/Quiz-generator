module.exports = {
  darkMode: 'class',
  // ... other config
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slower': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 2s',
        'float-slow': 'float 10s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        }
      },
      fontFamily: {
        spaceGrotesk: ['Space Grotesk', 'sans-serif'],
      },
    }
  }
} 