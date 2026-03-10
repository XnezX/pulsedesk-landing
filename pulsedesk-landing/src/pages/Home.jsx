import React from "react";
import { Box } from "@mui/material";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/sections/Hero";
import Features from "../components/sections/Features";
import Pricing from "../components/sections/Pricing";
import Testimonials from "../components/sections/Testimonials";
import CTA from "../components/sections/CTA";

export default function Home({ mode, onToggleMode }) {
  return (
    <Box>
      <Navbar mode={mode} onToggleMode={onToggleMode} />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </Box>
  );
}
