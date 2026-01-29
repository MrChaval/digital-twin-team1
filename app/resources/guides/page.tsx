import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SecurityGuidesPage() {
  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Security Guides</h1>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed">
                Comprehensive guides to help you implement best practices and secure your digital assets.
              </p>
            </div>
          </div>
        </div>
        {/* Animated background */}
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:50px_50px] opacity-10"></div>
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {/* Guide 1 */}
            <Card className="bg-background border-primary/20 overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src="/digital-shield.png"
                  width={600}
                  height={400}
                  alt="Password Security Guide"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>Password Security Guide</CardTitle>
                <CardDescription>
                  Best practices for creating and managing secure passwords across your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn how to implement strong password policies, use password managers effectively, and deploy
                  multi-factor authentication to protect your accounts.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span>Read Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Guide 2 */}
            <Card className="bg-background border-primary/20 overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src="/secure-cloud-network.png"
                  width={600}
                  height={400}
                  alt="Cloud Security Guide"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>Cloud Security Guide</CardTitle>
                <CardDescription>
                  Securing your cloud infrastructure and applications against modern threats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This guide covers cloud security best practices, including identity and access management, data
                  encryption, network security, and continuous monitoring.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span>Read Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Guide 3 */}
            <Card className="bg-background border-primary/20 overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src="/digital-watchtower.png"
                  width={600}
                  height={400}
                  alt="Incident Response Guide"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>Incident Response Guide</CardTitle>
                <CardDescription>Preparing for and responding to security incidents effectively.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn how to develop an incident response plan, assemble your response team, and implement effective
                  procedures for detecting, containing, and recovering from security breaches.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span>Read Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Guide 4 */}
            <Card className="bg-background border-primary/20 overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src="/digital-fortress.png"
                  width={600}
                  height={400}
                  alt="Network Security Guide"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>Network Security Guide</CardTitle>
                <CardDescription>
                  Protecting your network infrastructure from unauthorized access and attacks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This comprehensive guide covers network segmentation, firewall configuration, intrusion
                  detection/prevention systems, and secure remote access solutions.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span>Read Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Guide 5 */}
            <Card className="bg-background border-primary/20 overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src="/unseen-threat.png"
                  width={600}
                  height={400}
                  alt="Phishing Prevention Guide"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>Phishing Prevention Guide</CardTitle>
                <CardDescription>Protecting your organization from sophisticated phishing attacks.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn how to identify phishing attempts, implement technical controls, and train employees to
                  recognize and report suspicious emails and messages.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span>Read Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Guide 6 */}
            <Card className="bg-background border-primary/20 overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src="/interconnected-threat-analysis.png"
                  width={600}
                  height={400}
                  alt="Data Protection Guide"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>Data Protection Guide</CardTitle>
                <CardDescription>Safeguarding sensitive data throughout its lifecycle.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This guide covers data classification, encryption, access controls, secure data transfer methods, and
                  compliance with data protection regulations.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span>Read Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
