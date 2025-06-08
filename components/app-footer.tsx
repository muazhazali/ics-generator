import { Github, Linkedin } from "lucide-react"

export function AppFooter() {
  return (
    <footer className="mt-8 sm:mt-16 border-t border-gray-200 pt-6 sm:pt-8">
      <div className="text-center space-y-4">
        <div className="text-xs sm:text-sm text-gray-500 px-2">
          <p>
            Powered by AI • Content is processed securely and not stored •
            <span className="block sm:inline sm:ml-2">Supports text input and file uploads</span>
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://github.com/muazhazali/ics-generator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-sm font-medium">GitHub</span>
            <Github className="h-4 w-4" />
          </a>
          
          <a
            href="https://www.linkedin.com/in/muazhazali/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <span className="text-sm font-medium">LinkedIn</span>
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
        
        <div className="text-xs text-gray-400">
          <p>© {new Date().getFullYear()} ICS Generator. Built with Next.js and AI.</p>
        </div>
      </div>
    </footer>
  )
} 