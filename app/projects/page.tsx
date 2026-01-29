import { Shield, AlertTriangle, FileCode, Lock, Server, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ClientProjectAdmin from "@/components/client-project-admin"
import { getProjects } from "@/app/actions/projects"

// Map icon strings to Lucide components
const iconMap = {
  AlertTriangle: AlertTriangle,
  Shield: Shield,
  FileCode: FileCode,
  Lock: Lock,
  Server: Server,
  Users: Users
}

export default async function ProjectsPage() {
  // Fetch projects directly using the server action.
  // Error handling can be added here if needed (e.g., display an error message)
  // but the fallback logic is removed per the request.
  const projects = await getProjects(); 

  return (
    <div className="flex flex-col">
      {/* Admin section for adding new projects - only visible to admins */}
      <ClientProjectAdmin />
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Projects</h1>
              <p className="max-w-[700px] text-gray-400 md:text-xl/relaxed">
                Comprehensive cybersecurity solutions to protect from evolving threats.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:50px_50px] opacity-10"></div>
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {/* Ensure projects is an array before mapping */}
            {Array.isArray(projects) && projects.map((project) => {
              // Type guard for items remains useful if the action could potentially return non-array items
              if (!Array.isArray(project.items)) return null; 
              const IconComponent = iconMap[project.icon as keyof typeof iconMap] || Shield; 
              
              return (
                <Card key={project.id} className="bg-background border-primary/20">
                  <CardHeader>
                    <div className="bg-primary/10 p-3 w-fit rounded-lg mb-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {project.items.map((item, i) => ( 
                        <li key={i} className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
