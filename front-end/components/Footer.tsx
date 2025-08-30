import { ModeToggle } from './modeToggle';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-surface-primary/50 text-foreground py-12 select-none border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex justify-left mb-8">
          <Link href="/">
            <Image src="/home.svg" alt="4V4 Logo" width={36} height={36} priority className='dark:invert-0 invert transition-all duration-200'/>
          </Link>
          <span className='mx-4 py-1 title text-xl'>4V4</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marketplace Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Marketplace</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/mint" className="hover:text-foreground transition-colors">Create</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Top Collections</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Listings</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Auctions</Link></li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Calendar</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Newsletter</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Learn</Link></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/creator-terms" className="hover:text-foreground transition-colors">Creator Terms of Use</Link></li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">FAQs</Link></li>
              <li><a href="mailto:support@4v4.xyz" className="hover:text-foreground transition-colors">Ask AI</a></li>
            </ul>
          </div>
        </div>

        <div className="text-sm mt-12 flex flex-col md:flex-row justify-between items-center text-muted-foreground">
          <p className="text-foreground">🄯 2025 4V4</p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-foreground transition-colors">X</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Discord</Link>
            <div className="ml-4 pl-4 border-l border-border">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
