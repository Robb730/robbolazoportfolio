import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Certificates from "./components/Certificates";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import FloatingOrbs from "./components/FloatingOrbs";
import FloatingChat from "./components/FloatingChat";
import useReveal from "./hooks/useReveal";
import useTheme from "./hooks/useTheme";
import useHackerCorruption from "./hooks/useHackerCorruption";
import Marquee from "./components/Marquee";
import ContextMenu from "./components/ContextMenu";
import EasterEggs from "./components/EasterEggs";

export default function App() {
  const scopeRef = useReveal();
  const { isDark, toggleTheme } = useTheme();
  useHackerCorruption();

  return (
    <div ref={scopeRef} className="min-h-screen bg-paper text-ink font-body">
      <FloatingOrbs />
      <Nav isDark={isDark} toggleTheme={toggleTheme} />
      <Hero />
      <main className="relative">
        <Marquee />
        <About isDark={isDark} />
        <Skills />
        <Projects />
        <Certificates />
        <Contact />
      </main>
      <Footer />
      <FloatingChat />
      <ContextMenu />
      <EasterEggs />
    </div>
  );
}
