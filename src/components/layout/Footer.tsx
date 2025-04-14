import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFacebook, 
  faTwitter, 
  faInstagram, 
  faLinkedin 
} from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-light-bg-secondary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary p-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <Link to="/" className="block mb-2">
              <img 
                src="/logo.svg" 
                alt="ConnectMore" 
                className="h-8" 
              />
            </Link>
            <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Find and join events that matter to you. Connect with your community.
            </p>
          </div>
          
          {/* Quick links */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/events" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors">
                  Map View
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          
          {/* For organizers */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">For Organizers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/organizer/dashboard" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/organizer/events/create" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors">
                  Create Event
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social media */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors"
              >
                <FontAwesomeIcon icon={faFacebook} size="lg" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors"
              >
                <FontAwesomeIcon icon={faTwitter} size="lg" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors"
              >
                <FontAwesomeIcon icon={faInstagram} size="lg" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-blue dark:hover:text-cm-yellow transition-colors"
              >
                <FontAwesomeIcon icon={faLinkedin} size="lg" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-light-bg-tertiary dark:border-dark-bg-tertiary text-center text-light-text-secondary dark:text-dark-text-secondary">
          <p>&copy; {currentYear} Connect More. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 