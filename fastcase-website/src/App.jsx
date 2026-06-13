import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import WhyChoose from './pages/WhyChoose';
import FAQ from './pages/FAQ';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import Disclaimer from './pages/Disclaimer';
import DataSecurity from './pages/DataSecurity';
import CookiePolicy from './pages/CookiePolicy';
import Contact from './pages/Contact';
import GrievanceOfficer from './pages/GrievanceOfficer';
import PracticeAreas from './pages/PracticeAreas';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors duration-300">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pt-[68px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/why-Fastcase" element={<WhyChoose />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/practice-areas" element={<PracticeAreas />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/data-security" element={<DataSecurity />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/grievance-officer" element={<GrievanceOfficer />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
