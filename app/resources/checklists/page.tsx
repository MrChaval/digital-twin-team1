import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SecurityChecklistsPage() {
  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Security Checklists</h1>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed">
                Comprehensive checklists to help you implement and verify security controls across your organization.
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
            {/* Checklist 1 */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Endpoint Security Checklist</CardTitle>
                <CardDescription>
                  Ensure all endpoints in your organization are properly secured against threats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement endpoint protection platform (EPP)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Configure automatic updates for OS and applications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Enable disk encryption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement application whitelisting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Configure host-based firewall</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Printer className="h-4 w-4" />
                  <span>Print Checklist</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Checklist 2 */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Cloud Security Checklist</CardTitle>
                <CardDescription>Essential security controls for cloud environments and services.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement strong IAM policies and MFA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Enable encryption for data at rest and in transit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Configure network security groups and ACLs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Set up logging and monitoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement secure CI/CD pipelines</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Printer className="h-4 w-4" />
                  <span>Print Checklist</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Checklist 3 */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Network Security Checklist</CardTitle>
                <CardDescription>Comprehensive controls to secure your network infrastructure.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement network segmentation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Configure firewalls and IDS/IPS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement secure remote access (VPN)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Secure wireless networks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Monitor network traffic</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Printer className="h-4 w-4" />
                  <span>Print Checklist</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Checklist 4 */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Web Application Security Checklist</CardTitle>
                <CardDescription>Essential security controls for web applications and APIs.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement input validation and output encoding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Configure secure authentication and session management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement proper access controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Use HTTPS and configure security headers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement security logging and monitoring</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Printer className="h-4 w-4" />
                  <span>Print Checklist</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Checklist 5 */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Data Protection Checklist</CardTitle>
                <CardDescription>Controls to protect sensitive data throughout its lifecycle.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement data classification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Enable encryption for sensitive data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement access controls based on least privilege</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Configure secure data backup and recovery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement secure data disposal procedures</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Printer className="h-4 w-4" />
                  <span>Print Checklist</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Checklist 6 */}
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Incident Response Checklist</CardTitle>
                <CardDescription>Steps to prepare for and respond to security incidents.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Develop incident response plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Establish incident response team</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Implement detection and alerting mechanisms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Define containment, eradication, and recovery procedures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>Establish post-incident analysis process</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Printer className="h-4 w-4" />
                  <span>Print Checklist</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
