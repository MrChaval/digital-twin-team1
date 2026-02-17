import { Award, GraduationCap, Briefcase, Calendar, CheckCircle, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background via-background/95 to-primary/5 dark:to-primary/10 relative overflow-hidden border-b">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">About Digital Twin III</h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                A cyber-hardened portfolio demonstrating real-world security competence through live threat monitoring and defense.
              </p>
            </div>
          </div>
        </div>
        {/* Animated background */}
        <div className="absolute inset-0 bg-grid-white/5 dark:bg-grid-white/5 bg-[size:50px_50px] opacity-20"></div>
      </section>

      {/* Project Overview Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_500px]">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Digital Twin III: Cyber-Hardened Portfolio</h2>
                <p className="text-xl text-muted-foreground">
                  <span className="text-primary font-semibold">Self-Defending Digital Identity</span>
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Digital Twin III is not just a portfolio—it's a living demonstration of cybersecurity competence. 
                  This project showcases a self-defending web application that actively monitors, detects, and responds 
                  to threats in real-time, providing transparent security telemetry to visitors.
                </p>
                <p className="text-muted-foreground">
                  Built with a Zero Trust architecture, every interaction is validated, logged, and displayed on a 
                  real-time attack dashboard. From bot detection and rate limiting to SQL injection prevention and 
                  client-side security monitoring, this portfolio demonstrates security-first development practices.
                </p>
                <p className="text-muted-foreground">
                  The goal is to create a portfolio that doesn't just tell employers about cybersecurity skills—it 
                  shows them in action. Every security feature is transparent, measurable, and designed to withstand 
                  real-world attacks while maintaining user experience.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[400px] aspect-square">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-3xl opacity-20 dark:opacity-30"></div>
                <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-card p-2">
                  <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-8 flex items-center justify-center h-full">
                    <Shield className="h-48 w-48 text-primary opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Security Stack</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Core Security Features</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Production-grade security technologies protecting this digital twin in real-time.
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-background border-primary/20">
              <CardHeader className="pb-2">
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Arcjet WAF</CardTitle>
                <CardDescription>Web Application Firewall</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time bot detection, rate limiting, and Shield protection against SQL injection and XSS attacks.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-primary/20">
              <CardHeader className="pb-2">
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Clerk Auth</CardTitle>
                <CardDescription>Zero Trust Authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Role-based access control with first-user auto-admin and comprehensive audit logging.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-primary/20">
              <CardHeader className="pb-2">
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Neon Postgres</CardTitle>
                <CardDescription>Serverless Database</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Drizzle ORM preventing SQL injection with attack logs, audit trails, and real-time threat data.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-primary/20">
              <CardHeader className="pb-2">
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-Time Dashboard</CardTitle>
                <CardDescription>Live Attack Monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  2-second refresh intervals with global threat map and instant geo-location updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Stack Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Technology</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Technical Stack & Architecture</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Modern web technologies and security frameworks powering this self-defending portfolio.
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Frontend & Framework</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Next.js 16 (App Router)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>React Server Components</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>TypeScript</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Tailwind CSS + shadcn/ui</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Vercel Edge Network</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Security Infrastructure</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Arcjet WAF (Bot, Rate Limit, Shield)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Clerk Authentication</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Manual User-Agent Validation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Client-Side Security Monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Real-Time Attack Logging</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Database & Backend</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Neon Postgres (Serverless)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Drizzle ORM</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Server Actions (No REST API)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Async Geo-Location Updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Comprehensive Audit Logging</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Development Timeline */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Evolution</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Development Timeline</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                The journey from basic portfolio to cyber-hardened digital twin.
              </p>
            </div>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/40 before:to-transparent">
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow-sm z-10 md:group-odd:ml-8 md:group-even:mr-8">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="w-full md:w-[calc(50%-4rem)] bg-background p-5 rounded-lg border border-primary/20 shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <h3 className="font-bold text-lg">Real-Time Security Dashboard</h3>
                  <time className="font-semibold text-primary flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Feb 2026
                  </time>
                </div>
                <p className="text-muted-foreground mb-2">Async Geo-Location & Live Attack Monitoring</p>
                <p className="text-sm text-muted-foreground">
                  Implemented instant attack log visibility with background geo-location updates, achieving 2-5 second dashboard response times. Added global threat map visualization and IP accuracy improvements for real-time security telemetry.
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow-sm z-10 md:group-odd:ml-8 md:group-even:mr-8">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="w-full md:w-[calc(50%-4rem)] bg-background p-5 rounded-lg border border-primary/20 shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <h3 className="font-bold text-lg">Zero Trust Security Integration</h3>
                  <time className="font-semibold text-primary flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Jan 2026
                  </time>
                </div>
                <p className="text-muted-foreground mb-2">Arcjet WAF & Comprehensive Attack Logging</p>
                <p className="text-sm text-muted-foreground">
                  Integrated Arcjet security platform with bot detection, rate limiting, and Shield protection. Implemented attack log database with audit trails, severity scoring, and client-side security monitoring (right-click, DevTools detection).
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow-sm z-10 md:group-odd:ml-8 md:group-even:mr-8">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="w-full md:w-[calc(50%-4rem)] bg-background p-5 rounded-lg border border-primary/20 shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <h3 className="font-bold text-lg">Foundation & Architecture</h3>
                  <time className="font-semibold text-primary flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Dec 2025
                  </time>
                </div>
                <p className="text-muted-foreground mb-2">Next.js 16, Clerk Auth & Neon Database</p>
                <p className="text-sm text-muted-foreground">
                  Built foundation with Next.js 16 App Router, Clerk authentication with role-based access control, and Neon Postgres with Drizzle ORM. Established secure server actions pattern and first-user auto-admin functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
