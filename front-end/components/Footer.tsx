import { ModeToggle } from './modeToggle';

export default function Footer() {
  return (
    <footer className="bg-surface-primary/50 text-foreground py-12 select-none border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marketplace Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Marketplace</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Create</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Top Collections</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Listings</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Auctions</a></li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Calendar</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Newsletter</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Learn</a></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Creator Terms of Use</a></li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">FAQs</a></li>
              <li><a href="mailto:support@4v4.xyz" className="hover:text-foreground transition-colors">Ask Something</a></li>
            </ul>
          </div>
        </div>

        <div className="text-sm mt-12 flex flex-col md:flex-row justify-between items-center text-muted-foreground">
          <p className="text-foreground">🄯 2025 4V4</p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground transition-colors">X</a>
            <a href="#" className="hover:text-foreground transition-colors">Discord</a>
            <div className="ml-4 pl-4 border-l border-border">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
