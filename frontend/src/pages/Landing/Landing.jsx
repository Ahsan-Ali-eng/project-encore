import Navbar from "../../components/layout/Navbar";
import Hero from "../../components/landing/Hero";
import Features from "../../components/landing/Features";
import HowItWorks from "../../components/landing/HowItWorks";
import Testimonials from "../../components/landing/Testimonials";
import Pricing from "../../components/landing/Pricing";
import CTA from "../../components/landing/CTA";
import Footer from "../../components/landing/Footer";

export default function Landing() {
  return (
  <>
  <Navbar />
  <Hero />
  <Features />
  <HowItWorks />
  <Testimonials />
  <Pricing />
  <CTA />
  <Footer />
  </>
  );
}