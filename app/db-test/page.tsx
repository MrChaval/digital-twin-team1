import { checkDatabaseStatus } from "@/app/actions/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default async function DbTestPage() {
  const result = await checkDatabaseStatus();

  return (
    <div className="container py-12 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
          <CardDescription>Test the connection to your Neon Postgres database.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Click the button below to test the database connection.</p>
          {result.success ? (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <h3 className="font-medium text-green-800 dark:text-green-300">Connection Successful</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Server time: {result.timestamp ? new Date(result.timestamp).toLocaleString() : "Unknown"}
              </p>
              <div className="mt-2 text-sm">
                <p>Subscribers: {result.counts?.subscribers}</p>
                <p>Blog Posts: {result.counts?.blogPosts}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <h3 className="font-medium text-red-800 dark:text-red-300">Connection Failed</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {result.message} {result.error && <span>- {result.error}</span>}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <form action="" className="w-full">
            <Button type="submit" className="w-full" disabled>
              Test Connection
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
