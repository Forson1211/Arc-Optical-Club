import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import PlaceholderPage from './pages/PlaceholderPage'
import Contact from './pages/Contact'
import Programs from './pages/Programs'
import OurStory from './pages/OurStory'
import RouteScrollReset from './components/RouteScrollReset'
import Team from './pages/Team'
import AdminAccess from './pages/admin/AdminAccess'
import Join from './pages/Join'
import SiteActivityTracker from './components/SiteActivityTracker'
import WhatsAppChat from './components/WhatsAppChat'

const pages = [
  { path: '/gallery', title: 'Gallery', description: 'Moments from our community outreach, screenings, events and learning activities.' },
  { path: '/academy', title: 'ARC Academy', description: 'Mentorship, training and professional development for students and professionals.' },
  { path: '/research', title: 'Research', description: 'Explore our Journal Club, publications, research projects and learning opportunities.' },
  { path: '/donate', title: 'Give the gift of sight', description: 'Support free eye screenings, eye-health education and community care. Partner or sponsor an initiative.' },
  { path: '/news', title: 'News & Stories', description: 'Updates, announcements, outreach stories and eye-health education from Arc Optical Club.' },
]

export default function App() {
  return <><RouteScrollReset /><SiteActivityTracker /><Routes><Route path="/admin/*" element={<AdminAccess />} /><Route element={<div className="min-h-screen bg-[#10394B]"><Navbar /><Outlet /><Footer /><WhatsAppChat /></div>}><Route path="/" element={<Home />} /><Route path="/about" element={<OurStory />} /><Route path="/programs" element={<Programs />} /><Route path="/contact" element={<Contact />} /><Route path="/join" element={<Join />} /><Route path="/team" element={<Team />} />{pages.map(page => <Route key={page.path} path={page.path} element={<PlaceholderPage title={page.title} description={page.description} />} />)}<Route path="*" element={<PlaceholderPage title="Page not found" description="The page you are looking for may have moved or is not available yet." />} /></Route></Routes></>
}
