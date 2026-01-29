import Link from "next/link"
import Image from "next/image"
import { Shield, Lock, Server, Database, AlertTriangle, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewsletterForm } from "@/components/newsletter-form"
import { db, blogPosts } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function Home() {
  // Fetch the latest 3 blog posts with error handling
  let latestPosts: { id: string; slug: string; title: string; excerpt: string; coverImage?: string; createdAt: string }[] = []
  let dbError = false

  try {
    latestPosts = (await db.select().from(blogPosts).orderBy(blogPosts.createdAt).limit(3)).map(post => ({
      id: post.id.toString(),
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage || undefined,
      createdAt: post.createdAt ? post.createdAt.toISOString() : ""
    }))
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    dbError = true
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                  Securing Your Digital Future
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Expert cybersecurity solutions to protect your organization from evolving threats. Penetration
                  testing, security audits, and incident response services.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                {/* <Link href="/contact">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link> */}
                <Link href="/projects">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[500px] aspect-square">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative bg-black/40 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <div className="h-2 w-[80%] bg-primary/20 rounded-full"></div>
                      <div className="h-2 w-[60%] bg-primary/20 rounded-full"></div>
                    </div>
                    <div className="h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <div className="h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Server className="h-8 w-8 text-primary" />
                    </div>
                    <div className="h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2 col-span-2 mt-2">
                      <div className="h-2 w-[70%] bg-primary/20 rounded-full"></div>
                      <div className="h-2 w-[50%] bg-primary/20 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Animated background */}
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:50px_50px] opacity-10"></div>
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Database Error Alert */}
      {dbError && (
        <div className="container px-4 md:px-6 py-6">
          <Alert variant="destructive">
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              There was an error connecting to the database. Please try refreshing the page or contact support if the
              issue persists.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Services Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Projects</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Comprehensive Cybersecurity Solutions</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Protect you from cybersecurity attackers.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <AlertTriangle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Penetration Testing</CardTitle>
                <CardDescription>
                  Identify vulnerabilities before attackers do with our comprehensive penetration testing services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Web Application Testing</li>
                  <li>Network Infrastructure Testing</li>
                  <li>Mobile Application Testing</li>
                  <li>Social Engineering Assessments</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Security Audits</CardTitle>
                <CardDescription>
                  Comprehensive assessment of your security posture against industry standards and best practices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Compliance Assessments</li>
                  <li>Security Architecture Review</li>
                  <li>Cloud Security Assessment</li>
                  <li>Risk Assessment</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <FileCode className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Security Training</CardTitle>
                <CardDescription>
                  Empower your team with the knowledge to recognize and respond to security threats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Security Awareness Training</li>
                  <li>Phishing Simulations</li>
                  <li>Developer Security Training</li>
                  <li>Incident Response Drills</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_800px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Experience</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  15+ Years of Cybersecurity Expertise
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                  With extensive experience in the cybersecurity industry, I&apos;ve helped organizations of all sizes
                  protect their digital assets and infrastructure.
                </p>
              </div>
              <ul className="grid gap-2 py-4">
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span>Certified Information Systems Security Professional (CISSP)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span>Certified Ethical Hacker (CEH)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span>Offensive Security Certified Professional (OSCP)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span>Certified Cloud Security Professional (CCSP)</span>
                </li>
              </ul>
              <div>
                <Link href="/about">
                  <Button variant="outline">Learn More About My Experience</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-lg bg-primary/10 p-2 lg:p-4">
                    <Image
                      src="/digital-watchtower.png"
                      width={300}
                      height={300}
                      alt="Security monitoring"
                      className="aspect-square rounded-md object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg bg-primary/10 p-2 lg:p-4">
                    <Image
                      src="/digital-fortress.png"
                      width={300}
                      height={300}
                      alt="Network security"
                      className="aspect-square rounded-md object-cover"
                    />
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-lg bg-primary/10 p-2 lg:p-4">
                    <Image
                      src="/cyber-guardian.png"
                      width={300}
                      height={300}
                      alt="Cybersecurity professional"
                      className="aspect-square rounded-md object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg bg-primary/10 p-2 lg:p-4">
                    <Image
                      src="/modern-soc-overview.png"
                      width={300}
                      height={300}
                      alt="Security operations center"
                      className="aspect-square rounded-md object-cover"
                    />
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-lg bg-primary/10 p-2 lg:p-4">
                    <Image
                      src="/digital-security-breach.png"
                      width={300}
                      height={300}
                      alt="Penetration testing"
                      className="aspect-square rounded-md object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg bg-primary/10 p-2 lg:p-4">
                    <Image
                      src="/interconnected-threat-analysis.png"
                      width={300}
                      height={300}
                      alt="Cyber threat intelligence"
                      className="aspect-square rounded-md object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Newsletter</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Stay Updated on Cybersecurity Trends
              </h2>
              <p className="max-w-[600px] text-gray-400 md:text-xl/relaxed">
                Subscribe to our newsletter for the latest cybersecurity news, tips, and insights.
              </p>
            </div>
            <div className="w-full max-w-md">
              <NewsletterForm />
            </div>
          </div>
        </div>
        {/* Animated background */}
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:50px_50px] opacity-10"></div>
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>
      </section>

      {/* Recent Blog Posts */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Blog</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Latest Insights</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Stay informed with our latest articles on cybersecurity trends, threats, and best practices.
              </p>
            </div>
          </div>

          {dbError ? (
            <div className="mx-auto max-w-5xl py-12 text-center">
              <p className="text-muted-foreground">Unable to load blog posts at this time. Please try again later.</p>
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <Card className="overflow-hidden bg-background border-primary/20 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
                    <div className="aspect-video w-full overflow-hidden">
                      <Image
                        src={post.coverImage || "/placeholder.svg?height=400&width=600&query=cybersecurity"}
                        width={600}
                        height={400}
                        alt={post.title}
                        className="object-cover transition-all duration-200 group-hover:scale-105"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription>{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Link href="/blog">
              <Button variant="outline">View All Articles</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
