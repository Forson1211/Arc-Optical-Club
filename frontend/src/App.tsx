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
import Gallery from './pages/Gallery'
import Learning from './pages/Learning'
import Donate from './pages/Donate'
import DonationReturn from './pages/DonationReturn'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import './pages/content.css'
import Seo from './components/Seo'
import Partners from './pages/Partners'
import ScrollReveal from './components/ScrollReveal'

const pages = [
  { path: '/partners', element: <Partners /> },
  { path: '/gallery', element: <Gallery /> },
  { path: '/academy', element: <Learning /> },
  { path: '/research', element: <Learning research /> },
  { path: '/donate', element: <Donate /> },
  { path: '/donate/thank-you', element: <DonationReturn /> },
  { path: '/news', element: <News /> },
  { path: '/news/:id', element: <NewsDetail /> },
]

export default function App() {
  return (
    <>
      <Seo />
      <RouteScrollReset />
      <ScrollReveal />
      <SiteActivityTracker />
      <Routes>
        <Route path="/admin/*" element={<AdminAccess />} />
        <Route element={<div className="site-typography min-h-screen bg-[#10394B]"><Navbar /><Outlet /><Footer /><WhatsAppChat /></div>}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<OurStory />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/join" element={<Join />} />
          <Route path="/team" element={<Team />} />
          {pages.map(page => (
            <Route key={page.path} path={page.path} element={page.element} />
          ))}
          <Route path="*" element={<PlaceholderPage title="Page not found" description="The page you are looking for may have moved or is not available." />} />
        </Route>
      </Routes>
    </>
  )
}
