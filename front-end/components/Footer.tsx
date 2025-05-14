export default function Footer() {
  return (
    <footer className="bg-opacity-50 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marketplace Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4">Marketplace</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Create</a></li>
              <li><a href="#" className="hover:text-white">Top Collections</a></li>
              <li><a href="#" className="hover:text-white">Listings</a></li>
              <li><a href="#" className="hover:text-white">Auctions</a></li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Calendar</a></li>
              <li><a href="#" className="hover:text-white">Newsletter</a></li>
              <li><a href="#" className="hover:text-white">Learn</a></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Creator Terms of Use</a></li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="title text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="mailto:support@4v4.io" className="hover:text-white">support@4v4.io</a></li>
            </ul>
          </div>
        </div>

        <div className="text-sm mt-12 flex flex-col md:flex-row justify-between items-center text-gray-400">
          <p>© 2025 4V4</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">X</a>
            <a href="#" className="hover:text-white">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
