import { Routes, Route, Link } from 'react-router-dom';
import { useDisableInspect } from './hooks/useDisableInspect';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import AdvocateERP from './pages/AdvocateERP';
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
import ConsumerPortal from './pages/ConsumerPortal';

function NotFound() {
  return (
    <section className="section-container py-24 text-center">
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#059669]">Page not found</p>
      <h1 className="mt-3 font-heading font-[900] text-3xl sm:text-4xl text-slate-900">This page does not exist.</h1>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary text-sm">Go to home</Link>
        <Link to="/consumer-portal" className="btn-secondary text-sm">Consumer Portal</Link>
        <Link to="/advocate-erp" className="btn-secondary text-sm">Advocate ERP</Link>
      </div>
    </section>
  );
}

export default function App() {
  // Deter inspecting shortcuts and right-click
  useDisableInspect();

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors duration-300">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pt-[68px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/advocate-erp" element={<AdvocateERP />} />
          <Route path="/consumer-portal" element={<ConsumerPortal />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/practice-areas" element={<PracticeAreas />} />
          <Route path="/why-Fastcase" element={<WhyChoose />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/data-security" element={<DataSecurity />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/grievance-officer" element={<GrievanceOfficer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
