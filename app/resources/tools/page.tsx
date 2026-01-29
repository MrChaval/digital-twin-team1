import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SecurityToolsPage() {
  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Security Tools</h1>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed">
                A curated collection of essential cybersecurity tools to enhance your security posture.
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
            {/* Network Security Tools */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <Badge>Network Security</Badge>
                </div>
                <CardTitle>Wireshark</CardTitle>
                <CardDescription>
                  The world&apos;s foremost and widely-used network protocol analyzer for network troubleshooting and
                  analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Wireshark is a free and open-source packet analyzer used for network troubleshooting, analysis,
                  software and communications protocol development, and education.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href="https://www.wireshark.org/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button className="flex items-center gap-2" asChild>
                    <a href="https://www.wireshark.org/download.html" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Assessment */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <Badge>Vulnerability Assessment</Badge>
                </div>
                <CardTitle>Nmap</CardTitle>
                <CardDescription>
                  A free and open source utility for network discovery and security auditing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Nmap uses raw IP packets to determine what hosts are available on the network, what services those
                  hosts are offering, what operating systems they are running, and more.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href="https://nmap.org/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button className="flex items-center gap-2" asChild>
                    <a href="https://nmap.org/download.html" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Penetration Testing */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <Badge>Penetration Testing</Badge>
                </div>
                <CardTitle>Metasploit Framework</CardTitle>
                <CardDescription>
                  A powerful open-source penetration testing framework used for developing and executing exploit code
                  against remote targets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  The Metasploit Framework is a Ruby-based, modular penetration testing platform that enables you to
                  write, test, and execute exploit code.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href="https://www.metasploit.com/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button className="flex items-center gap-2" asChild>
                    <a href="https://www.metasploit.com/download" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Security */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <Badge>Password Security</Badge>
                </div>
                <CardTitle>KeePass</CardTitle>
                <CardDescription>A free, open source, lightweight, and easy-to-use password manager.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  KeePass helps you to manage your passwords in a secure way. You can store all your passwords in one
                  database, which is locked with a master key.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href="https://keepass.info/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button className="flex items-center gap-2" asChild>
                    <a href="https://keepass.info/download.html" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Forensics */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <Badge>Digital Forensics</Badge>
                </div>
                <CardTitle>Autopsy</CardTitle>
                <CardDescription>
                  A digital forensics platform and graphical interface to The Sleuth Kit and other digital forensics
                  tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Autopsy is a digital forensics tool that makes it easier to analyze hard drives and smartphones. It
                  has a plug-in architecture that allows you to find add-on modules or develop custom modules.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href="https://www.autopsy.com/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button className="flex items-center gap-2" asChild>
                    <a href="https://www.autopsy.com/download/" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Encryption */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <Badge>Encryption</Badge>
                </div>
                <CardTitle>VeraCrypt</CardTitle>
                <CardDescription>A free disk encryption software based on TrueCrypt.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  VeraCrypt is a free, open-source disk encryption software that can create a virtual encrypted disk
                  within a file or encrypt a partition or the entire storage device with pre-boot authentication.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href="https://www.veracrypt.fr/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button className="flex items-center gap-2" asChild>
                    <a href="https://www.veracrypt.fr/en/Downloads.html" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
