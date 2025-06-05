# ICS Generator

A modern web application built with Next.js for generating and managing ICS (iCalendar) files. This project provides a user-friendly interface for creating and managing calendar events that can be exported in the standard ICS format.

## 🚀 Tech Stack

### Core Technologies
- **Next.js 14** - React framework for production
- **TypeScript** - For type-safe code
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible components
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **date-fns** - Date manipulation library

### UI Components
- **Radix UI Components** - Comprehensive set of accessible UI components
- **Lucide React** - Beautiful icons
- **Embla Carousel** - Carousel component
- **Recharts** - Charting library
- **Sonner** - Toast notifications
- **Vaul** - Drawer component

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- pnpm (Package manager)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ics-generator.git
cd ics-generator
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory (if required):
```bash
cp .env.example .env.local
```

## 🚀 Development

To start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Building for Production

To create a production build:

```bash
pnpm build
```

To start the production server:

```bash
pnpm start
```

## 🧪 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 📁 Project Structure

```
ics-generator/
├── app/                 # Next.js app directory
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── public/             # Static assets
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## 🎨 UI Components

The project uses a comprehensive set of UI components from Radix UI, including:
- Accordion
- Alert Dialog
- Avatar
- Checkbox
- Dialog
- Dropdown Menu
- Navigation Menu
- Popover
- Tabs
- Toast
- And many more...

## 🔧 Configuration Files

- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - PostCSS configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/) 