import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Code2, Layers, Rocket, CheckCircle2, Users, Zap, Shield, GitBranch, Terminal } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" data-testid="landing-page">
      {/* Navigation - Always Black */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/95 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
          <div className="h-11 overflow-hidden flex items-center">
            <img src="/evax-logo.png" alt="EVA-X" className="h-[140px] w-auto max-w-none" />
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#workflow" className="text-sm text-white/60 hover:text-white transition-colors" data-testid="nav-workflow">
              How it works
            </a>
            <a href="#team" className="text-sm text-white/60 hover:text-white transition-colors" data-testid="nav-team">
              Team
            </a>
            <a href="#builders" className="text-sm text-white/60 hover:text-white transition-colors" data-testid="nav-builders">
              For Builders
            </a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/builder/auth')}
              className="hidden sm:flex text-sm text-white/60 hover:text-white transition-colors px-4 py-2 hover:bg-white/10 rounded-xl"
              data-testid="nav-login"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/client/auth')}
              className="bg-white text-black hover:bg-white/90 text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
              data-testid="nav-start"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] icon-bg-blue rounded-full blur-[150px]" />
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/70120df5-824e-4d4e-b8dc-1a4556713200/images/64ffe797a50f1868e997b417f8fd0bb29f49c2f437047e9a73ea04a767c23a3a.png"
            alt=""
            className="absolute right-0 top-20 w-1/2 h-auto opacity-20 object-contain"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-24 grid md:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border backdrop-blur-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium tracking-wide">EXECUTION PLATFORM</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.1] text-foreground">
              Ship products,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">not tickets</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
              From idea to production. Real developers, structured workflow, verified delivery.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
              <button 
                onClick={() => navigate('/client/auth')}
                className="group bg-foreground text-background hover:opacity-90 border border-foreground font-medium px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
                data-testid="hero-start-button"
              >
                Start Your Project
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/builder/auth')}
                className="text-muted-foreground hover:text-foreground font-medium px-6 py-4 transition-colors flex items-center gap-2"
                data-testid="hero-join-button"
              >
                <Code2 className="w-5 h-5" />
                Join as Builder
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div>
                <div className="text-2xl font-semibold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Delivery rate</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">4 weeks</div>
                <div className="text-sm text-muted-foreground">Avg. MVP time</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">200+</div>
                <div className="text-sm text-muted-foreground">Active builders</div>
              </div>
            </div>
          </div>

          {/* Right - Animated Terminal */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl" />
            <AnimatedTerminal />
          </div>
        </div>
      </section>

      {/* Workflow Section - Bento Grid */}
      <section id="workflow" className="relative py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">How it works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From your idea to a working product in three structured phases</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Submit Card - Span 4 */}
            <div className="md:col-span-4 relative group">
              <div className="h-full p-8 rounded-2xl bg-card border border-border hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 icon-bg-blue rounded-full blur-3xl group-hover:bg-blue-600/20 transition-colors" />
                <div className="relative">
                  <div className="w-12 h-12 icon-bg-blue rounded-xl flex items-center justify-center mb-6">
                    <Layers className="w-6 h-6 icon-text-blue" />
                  </div>
                  <div className="text-xs icon-text-blue font-mono mb-2">01</div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Submit</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Describe your product idea. We analyze requirements and create a detailed scope with timeline.
                  </p>
                  {/* Mini form UI */}
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <div className="text-[10px] text-muted-foreground mb-2 font-mono">PROJECT REQUEST</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg">
                        <div className="w-1 h-4 bg-blue-500 rounded-full" />
                        <span className="text-xs text-muted-foreground">Mobile App MVP</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg">
                        <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                        <span className="text-xs text-muted-foreground">React + Node.js</span>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2 bg-muted hover:bg-muted/80 border border-border text-foreground text-xs rounded-lg transition-colors">
                      Submit Idea
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Execute Card - Span 8 */}
            <div className="md:col-span-8 relative group">
              <div className="h-full p-8 rounded-2xl bg-card border border-border hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 icon-bg-purple rounded-full blur-3xl group-hover:bg-purple-600/20 transition-colors" />
                <div className="relative grid md:grid-cols-2 gap-8 h-full">
                  <div>
                    <div className="w-12 h-12 icon-bg-purple rounded-xl flex items-center justify-center mb-6">
                      <Terminal className="w-6 h-6 icon-text-purple" />
                    </div>
                    <div className="text-xs icon-text-purple font-mono mb-2">02</div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">Execute</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      Real developers build your product. Every task is tracked, reviewed, and validated through our QA process.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">Kanban Board</span>
                      <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">Code Review</span>
                      <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">QA Testing</span>
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src="https://static.prod-images.emergentagent.com/jobs/70120df5-824e-4d4e-b8dc-1a4556713200/images/65440009f9ca3a8ef4f630206bfb926b7e323e1669690729dd31687e7de48f36.png"
                      alt="Code terminal"
                      className="w-full h-full object-cover rounded-xl opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Ship Card - Span 6 */}
            <div className="md:col-span-6 relative group">
              <div className="h-full p-8 rounded-2xl bg-card border border-border hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl group-hover:bg-emerald-600/20 transition-colors" />
                <div className="relative">
                  <div className="w-12 h-12 bg-emerald-600/10 rounded-xl flex items-center justify-center mb-6">
                    <Rocket className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-xs text-emerald-500 font-mono mb-2">03</div>
                  <h3 className="text-xl font-semibold mb-3">Ship</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Review deliverables with full transparency. Approve and launch your product with confidence.
                  </p>
                  {/* Delivery status UI */}
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-muted-foreground font-mono">DELIVERY STATUS</span>
                      <span className="text-[10px] text-emerald-400 font-mono">COMPLETED</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-xs text-muted-foreground">Frontend deployed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-xs text-muted-foreground">API integrated</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-xs text-muted-foreground">QA passed</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-600/40 border border-[#0a0a0f]" />
                        <div className="w-6 h-6 rounded-full bg-purple-600/40 border border-[#0a0a0f]" />
                        <div className="w-6 h-6 rounded-full bg-emerald-600/40 border border-[#0a0a0f]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">3 builders</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Card - Span 6 */}
            <div className="md:col-span-6 relative group">
              <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-border hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                <div className="grid grid-cols-2 gap-6 h-full">
                  <MetricCard icon={<CheckCircle2 className="w-5 h-5" />} value="500+" label="Projects delivered" />
                  <MetricCard icon={<Users className="w-5 h-5" />} value="200+" label="Active builders" />
                  <MetricCard icon={<Zap className="w-5 h-5" />} value="4 weeks" label="Average MVP time" />
                  <MetricCard icon={<Shield className="w-5 h-5" />} value="98%" label="Satisfaction rate" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Builders Section - Always Black */}
      <section id="builders" className="relative py-24 sm:py-32 bg-[#0a0a0f] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left - Code Animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-2xl" />
              <BuilderCodeAnimation />
            </div>

            {/* Right - Content */}
            <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Join as <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Builder</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed">
                Work on real projects. Get paid for quality. Build your portfolio with production experience.
              </p>
              
              <div className="space-y-4">
                <BulletPoint text="Structured tasks with clear requirements" />
                <BulletPoint text="Fair compensation based on skill level" />
                <BulletPoint text="Flexible remote work on your schedule" />
                <BulletPoint text="Build portfolio with real shipped products" />
              </div>

              <button 
                onClick={() => navigate('/builder/auth')}
                className="group bg-white/10 hover:bg-white/15 text-white font-medium px-8 py-4 rounded-xl transition-all border border-white/20 hover:border-white/30 flex items-center gap-3"
                data-testid="builder-apply-button"
              >
                <GitBranch className="w-5 h-5" />
                Apply to Build
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}


      {/* Team Section - Encrypted/Pixelated */}
      <section id="team" className="relative py-24 sm:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border backdrop-blur-sm mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium tracking-wide">ENCRYPTED IDENTITIES</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter mb-4">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">System</span> Behind It
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Anonymous operators. Verified skills. Pure execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                role: 'CEO', 
                code: '0x001', 
                hash: 'a4f9c2e1',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,2,2,2,2,2',
                  '2,2,2,3,0,0,3,2,2,2,2,2,2,2,2,3,0,0,3,2,2,2,2,2',
                  '2,2,2,3,0,0,3,2,2,2,2,2,2,2,2,3,0,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              },
              { 
                role: 'CTO', 
                code: '0x002', 
                hash: 'b8d3f7a2',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2,2',
                  '2,2,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2,2',
                  '2,2,2,3,3,0,0,3,2,2,2,2,2,2,3,3,0,0,3,2,2,2,2,2',
                  '2,2,2,3,3,0,0,3,2,2,2,2,2,2,3,3,0,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,3,3,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              },
              { 
                role: 'Product Manager', 
                code: '0x003', 
                hash: 'c1e6b9d4',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2,2,2,2',
                  '2,2,2,2,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2,2,2,2,2',
                  '2,2,2,2,3,3,0,3,2,2,2,2,2,2,3,3,0,3,2,2,2,2,2,2',
                  '2,2,2,2,3,3,0,3,2,2,2,2,2,2,3,3,0,3,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,2,2,2,2,2,2,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              },
              { 
                role: 'Backend Developer', 
                code: '0x004', 
                hash: 'd2f8c3e5',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,6,6,6,6,6,2,2,2,2,2,2,6,6,6,6,6,2,2,2,2,2',
                  '2,2,2,6,6,0,0,6,2,2,2,2,2,2,6,6,0,0,6,2,2,2,2,2',
                  '2,2,2,6,6,6,6,6,2,2,2,2,2,2,6,6,6,6,6,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,7,7,7,7,7,7,7,7,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              },
              { 
                role: 'Contract Engineer', 
                code: '0x005', 
                hash: 'e9a1d6f2',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,2,2,2,2',
                  '2,2,2,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,2,2,2,2,2',
                  '2,2,2,3,3,3,0,3,2,2,2,2,2,2,3,3,3,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,0,3,2,2,2,2,2,2,3,3,3,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,3,3,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              },
              { 
                role: 'Database Architect', 
                code: '0x006', 
                hash: 'f3c7e2b8',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,2,2,2,2,2',
                  '2,2,2,3,0,0,3,2,2,2,2,2,2,2,2,3,0,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,7,7,7,7,7,7,7,7,7,7,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              },
              { 
                role: 'Frontend Developer', 
                code: '0x007', 
                hash: 'a7b4f1c9',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2,2',
                  '2,2,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2,2',
                  '2,2,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2,2',
                  '2,2,2,3,3,3,0,3,2,2,2,2,2,2,3,3,3,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,0,3,2,2,2,2,2,2,3,3,3,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,3,3,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              },
              { 
                role: 'UI/UX Designer', 
                code: '0x008', 
                hash: 'b2e8d5a3',
                pixelArt: [
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,8,8,8,8,8,8,8,8,8,8,8,8,8,2,2,2,2,2,2,2',
                  '2,2,2,2,2,8,8,8,8,8,8,8,8,8,8,8,2,2,2,2,2,2,2,2',
                  '2,2,2,3,3,3,0,3,2,2,2,2,2,2,3,3,3,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,0,3,2,2,2,2,2,2,3,3,3,0,3,2,2,2,2,2',
                  '2,2,2,3,3,3,3,3,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2',
                  '2,2,2,2,3,9,9,1,1,1,1,1,1,1,9,9,9,3,2,2,2,2,2,2',
                  '2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2',
                  '2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0',
                  '0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0',
                  '0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0',
                  '0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0'
                ]
              }
            ].map((member, idx) => {
              const colorMap = {
                '0': 'bg-black',
                '1': 'bg-pink-400',
                '2': 'bg-[#D4A373]',
                '3': 'bg-[#8B4513]',
                '4': 'bg-gray-700',
                '5': 'bg-yellow-600',
                '6': 'bg-purple-600',
                '7': 'bg-emerald-600',
                '8': 'bg-blue-900',
                '9': 'bg-red-500'
              };

              return (
                <div 
                  key={idx}
                  className="group relative border border-border rounded-2xl p-6 bg-gradient-to-br from-white/5 to-transparent hover:from-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                  data-testid={`team-member-${idx}`}
                >
                  {/* CryptoPunk-style Avatar */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-border group-hover:border-blue-500/50 transition-all">
                      {/* 24x24 Pixel Grid with defined face */}
                      <div className="absolute inset-0 grid grid-cols-24 grid-rows-24 gap-0">
                        {member.pixelArt.flatMap((row, rowIdx) => 
                          row.split(',').map((pixel, colIdx) => (
                            <div 
                              key={`${rowIdx}-${colIdx}`}
                              className={`${colorMap[pixel] || 'bg-transparent'} transition-opacity duration-300`}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="text-center mb-2">
                    <div className="text-white font-medium mb-1">{member.role}</div>
                    <div className="text-xs text-muted-foreground font-mono">ID: {member.code}</div>
                  </div>

                  {/* Encrypted Hash */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">HASH</span>
                      <span className="text-blue-400">{member.hash}</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">ACTIVE</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Note */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-xs text-muted-foreground font-mono">
              <Shield className="w-3 h-3" />
              <span>All identities encrypted • Skills verified • Performance tracked</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-card">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
            
            <div className="relative text-center py-20 px-8">
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
                Ready to ship?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
                Get a structured scope and timeline within 24 hours. No commitment required.
              </p>
              <button 
                onClick={() => navigate('/client/auth')}
                className="group bg-blue-600 hover:bg-blue-500 text-white font-medium px-10 py-5 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 text-lg flex items-center gap-3 mx-auto"
                data-testid="cta-start-button"
              >
                Start Your Project
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Always Black */}
      <footer className="border-t border-white/10 bg-[#020205]">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20">
          <div className="grid md:grid-cols-12 gap-12">
            {/* Brand Column */}
            <div className="md:col-span-5">
              <div className="h-11 overflow-hidden flex items-center mb-6">
                <img src="/evax-logo.png" alt="EVA-X" className="h-[140px] w-auto max-w-none" />
              </div>
              <p className="text-white/60 text-lg font-medium mb-2">
                Development Operating System
              </p>
              <p className="text-white/40 max-w-sm leading-relaxed">
                Turn ideas into working products. Real developers, structured process, guaranteed results.
              </p>
            </div>
            
            {/* Navigation Columns */}
            <div className="md:col-span-7 grid grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Platform</h4>
                <div className="space-y-4">
                  <a href="#workflow" className="block text-white/50 hover:text-white transition-colors text-sm">How it works</a>
                  <a href="#builders" className="block text-white/50 hover:text-white transition-colors text-sm">For Builders</a>
                  <a href="#" className="block text-white/50 hover:text-white transition-colors text-sm">Pricing</a>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Access</h4>
                <div className="space-y-4">
                  <button onClick={() => navigate('/client/auth')} className="block text-white/50 hover:text-white transition-colors text-sm text-left">Client Portal</button>
                  <button onClick={() => navigate('/builder/auth')} className="block text-white/50 hover:text-white transition-colors text-sm text-left">Builder Portal</button>
                  <button onClick={() => navigate('/admin/login')} className="block text-white/50 hover:text-white transition-colors text-sm text-left">Admin</button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Company</h4>
                <div className="space-y-4">
                  <a href="#" className="block text-white/50 hover:text-white transition-colors text-sm">About</a>
                  <a href="#" className="block text-white/50 hover:text-white transition-colors text-sm">Contact</a>
                  <a href="#" className="block text-white/50 hover:text-white transition-colors text-sm">Careers</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">© 2026 DevOS. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-white/40 hover:text-white/60 transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-white/40 hover:text-white/60 transition-colors">Terms of Service</a>
              <span className="text-xs text-white/20 font-mono">v2.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Animated Terminal Component
const AnimatedTerminal = () => {
  const [lines, setLines] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const allLines = [
    { type: 'command', text: '$ devos create "Turn my idea into product"', delay: 0 },
    { type: 'output', text: 'Analyzing requirements...', delay: 100 },
    { type: 'success', text: 'AI Scope: 6 modules, $4,200 estimate', delay: 200 },
    { type: 'command', text: '$ devos approve --start', delay: 300 },
    { type: 'output', text: 'Matching elite builders to your project...', delay: 100 },
    { type: 'success', text: 'Team assembled: 2 devs, 1 QA', delay: 150 },
    { type: 'success', text: 'Sprint 1 started automatically', delay: 150 },
    { type: 'command', text: '$ devos watch', delay: 300 },
    { type: 'progress', text: 'Progress: [==========] 100%', delay: 200 },
    { type: 'output', text: 'All tasks completed. Quality: 98%', delay: 100 },
    { type: 'command', text: '$ devos ship', delay: 300 },
    { type: 'output', text: 'Packaging deliverable...', delay: 200 },
    { type: 'success', text: 'Your product is live. Welcome to the future.', delay: 200 },
  ];

  useEffect(() => {
    if (currentIndex >= allLines.length) {
      const timeout = setTimeout(() => {
        setLines([]);
        setCurrentIndex(0);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setLines(prev => [...prev, allLines[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }, allLines[currentIndex]?.delay + 400 || 400);

    return () => clearTimeout(timeout);
  }, [currentIndex]);

  const contentRef = useRef(null);

  // Auto-scroll to bottom when new lines appear
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-[#0D0D12] shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white/[0.02]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-2">devos-cli ~/projects</span>
      </div>

      {/* Terminal content - Fixed height with overflow scroll */}
      <div 
        ref={contentRef}
        className="p-6 h-[360px] overflow-y-auto font-mono text-sm space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {lines.map((line, i) => (
          <div 
            key={i}
            className={`animate-fade-in ${
              line.type === 'command' ? 'text-white' :
              line.type === 'success' ? 'text-emerald-400' :
              line.type === 'progress' ? 'text-blue-400' :
              'text-muted-foreground'
            }`}
          >
            {line.type === 'success' && <span className="text-emerald-400 mr-2">✓</span>}
            {line.text}
          </div>
        ))}
        <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse" />
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, value, label }) => (
  <div className="text-center p-4">
    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <div className="text-2xl font-semibold mb-1">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

// Bullet Point Component
const BulletPoint = ({ text }) => (
  <div className="flex items-start gap-3">
    <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
      <CheckCircle2 className="w-3 h-3 icon-text-blue" />
    </div>
    <span className="text-muted-foreground">{text}</span>
  </div>
);


// Builder Code Animation - Python style algorithm that speaks to developers
const BuilderCodeAnimation = () => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const contentRef = useRef(null);
  
  const codeLines = [
    { text: 'class Builder:', color: 'text-purple-400' },
    { text: '    """Your skills. Real projects. Fair pay."""', color: 'text-emerald-400/70' },
    { text: '', color: '' },
    { text: '    def __init__(self, skills: list):', color: 'text-purple-400' },
    { text: '        self.skills = skills', color: 'text-white/80' },
    { text: '        self.portfolio = []', color: 'text-white/80' },
    { text: '        self.earnings = 0', color: 'text-white/80' },
    { text: '', color: '' },
    { text: '    def join_devos(self):', color: 'text-purple-400' },
    { text: '        # We match you with perfect tasks', color: 'text-muted-foreground' },
    { text: '        tasks = Task.match(self.skills)', color: 'text-white/80' },
    { text: '        return tasks  ', color: 'text-white/80', highlight: true },
    { text: '', color: '' },
    { text: '    def build(self, task) -> Result:', color: 'text-purple-400' },
    { text: '        result = self.code(task.spec)', color: 'text-white/80' },
    { text: '        self.portfolio.append(result)', color: 'text-white/80' },
    { text: '        return result.ship()', color: 'text-emerald-400' },
    { text: '', color: '' },
    { text: '    def get_paid(self, quality: float):', color: 'text-purple-400' },
    { text: '        rate = FAIR_RATE * quality', color: 'text-white/80' },
    { text: '        self.earnings += rate', color: 'text-white/80' },
    { text: '        return f"${self.earnings:,.0f}"', color: 'text-amber-400' },
    { text: '', color: '' },
    { text: '', color: '' },
    { text: '# You write code. We handle the rest.', color: 'text-blue-400' },
    { text: 'dev = Builder(["react", "python", "node"])', color: 'text-white/80' },
    { text: 'dev.join_devos()  ', color: 'text-emerald-400', highlight: true },
  ];

  useEffect(() => {
    if (isResetting) return;
    
    const timer = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= codeLines.length) {
          // Smooth reset - wait then restart
          setIsResetting(true);
          setTimeout(() => {
            setVisibleLines(0);
            setIsResetting(false);
          }, 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 350); // Same speed as top terminal
    
    return () => clearInterval(timer);
  }, [isResetting, codeLines.length]);

  // Auto-scroll to bottom when new lines appear
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-muted">
      {/* Window Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <span className="text-muted-foreground text-xs font-mono">builder.py</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded font-mono">Python</span>
        </div>
      </div>
      
      {/* Code Content - Fixed height with overflow hidden */}
      <div 
        ref={contentRef}
        className="p-5 font-mono text-sm leading-relaxed h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {codeLines.slice(0, visibleLines).map((line, i) => (
          <div 
            key={`${i}-${visibleLines > codeLines.length ? 'reset' : 'active'}`}
            className={`${line.color} ${line.highlight ? 'bg-emerald-500/10 -mx-5 px-5 border-l-2 border-emerald-500' : ''}`}
            style={{ 
              opacity: 0,
              animation: 'fadeInCode 0.4s forwards',
            }}
          >
            <span className="text-white/20 select-none mr-4 inline-block w-5 text-right">{i + 1}</span>
            {line.text || '\u00A0'}
          </div>
        ))}
        {visibleLines < codeLines.length && visibleLines > 0 && (
          <div>
            <span className="text-white/20 select-none mr-4 inline-block w-5 text-right">{visibleLines + 1}</span>
            <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse" />
          </div>
        )}
        {visibleLines === 0 && (
          <div>
            <span className="text-white/20 select-none mr-4 inline-block w-5 text-right">1</span>
            <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse" />
          </div>
        )}
      </div>
      
      {/* Bottom Stats */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Python 3.11</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span>Ready to build</span>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInCode {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};


export default LandingPage;
