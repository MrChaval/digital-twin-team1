import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { subscribers, blogPosts } from "../lib/db"
import { sql } from "drizzle-orm"

async function main() {
  console.log("Starting database migration...")

  // Determine the database connection string
  let connectionString: string

  // If DATABASE_URL is provided, use it directly
  if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL
  }
  // Otherwise, construct from individual PG* variables
  else if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE && process.env.PGPASSWORD) {
    connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`
  }
  // Fallback (should not happen if environment variables are properly set)
  else {
    console.warn("No database credentials found in environment variables. Using fallback connection string.")
    connectionString =
      "postgres://neondb_owner:npg_URfVtv9J5EoN@ep-summer-cell-a7bsfum3-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"
  }

  // Create a SQL query executor using the Neon serverless driver
  const sqlExecutor = neon(connectionString)

  // Create a Drizzle instance
  const db = drizzle(sqlExecutor)

  try {
    // Create the subscribers table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log("✅ Subscribers table created or already exists")

    await db.execute(sql`
      ALTER TABLE subscribers
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    `);
    console.log("✅ Role column added to subscribers table");

    // Create the blog_posts table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        cover_image TEXT,
        author TEXT NOT NULL,
        read_time TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log("✅ Blog posts table created or already exists")

    // Create the contact_submissions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        is_read TEXT DEFAULT 'false'
      )
    `)
    console.log("✅ Contact submissions table created or already exists")

    // Insert some sample data if the tables are empty
    const existingSubscribers = await db.select().from(subscribers).limit(1)

    if (existingSubscribers.length === 0) {
      await db.insert(subscribers).values([
        { email: "john.doe@example.com", name: "John Doe" },
        { email: "jane.smith@example.com", name: "Jane Smith" },
        { email: "robert.johnson@example.com", name: "Robert Johnson" },
      ])
      console.log("✅ Sample subscribers added")
    } else {
      console.log("ℹ️ Subscribers table already has data, skipping sample data insertion")
    }

    const existingPosts = await db.select().from(blogPosts).limit(1)

    if (existingPosts.length === 0) {
      await db.insert(blogPosts).values([
        {
          title: "Understanding Zero-Day Vulnerabilities",
          slug: "understanding-zero-day-vulnerabilities",
          excerpt: "What they are, how they're exploited, and how to protect your systems.",
          content: `<p>Zero-day vulnerabilities represent one of the most significant threats in cybersecurity today. These vulnerabilities are unknown to the software vendor and have no available patches, leaving systems exposed to potential attacks.</p>
          
          <h2>What is a Zero-Day Vulnerability?</h2>
          
          <p>A zero-day vulnerability is a software security flaw that is unknown to those who should be interested in mitigating the vulnerability (including the vendor of the target software). Until the vulnerability is mitigated, hackers can exploit it to adversely affect computer programs, data, additional computers or a network.</p>
          
          <p>The term "zero-day" refers to the fact that developers have had zero days to address and patch the vulnerability. Once a vulnerability becomes known, a race begins between the threat actors who want to exploit it and the developers who need to fix it.</p>
          
          <h2>The Lifecycle of a Zero-Day Vulnerability</h2>
          
          <ol>
            <li><strong>Discovery:</strong> A vulnerability is discovered, either by security researchers, the vendor, or malicious actors.</li>
            <li><strong>Exploitation:</strong> If discovered by attackers, they develop and deploy exploits before a patch is available.</li>
            <li><strong>Disclosure:</strong> The vulnerability is disclosed to the vendor or publicly announced.</li>
            <li><strong>Patching:</strong> The vendor develops and releases a patch to fix the vulnerability.</li>
            <li><strong>Deployment:</strong> Users and organizations apply the patch to protect their systems.</li>
          </ol>
          
          <h2>Protection Strategies</h2>
          
          <p>While zero-day vulnerabilities are challenging to defend against by their very nature, organizations can implement several strategies to minimize their risk:</p>
          
          <h3>1. Defense in Depth</h3>
          
          <p>Implement multiple layers of security controls so that if one fails, others will provide protection. This includes firewalls, intrusion detection/prevention systems, endpoint protection, and network segmentation.</p>
          
          <h3>2. Behavior-Based Detection</h3>
          
          <p>Use security solutions that can detect unusual behavior rather than relying solely on signature-based detection, which cannot identify unknown threats.</p>
          
          <h3>3. Timely Patching</h3>
          
          <p>While patches won't be available for zero-day vulnerabilities initially, maintaining a robust patch management program ensures that systems are protected once patches are released.</p>
          
          <h3>4. Principle of Least Privilege</h3>
          
          <p>Limit user permissions to only what is necessary for their roles. This can contain the damage if a zero-day exploit is successful.</p>
          
          <h3>5. Regular Security Assessments</h3>
          
          <p>Conduct regular vulnerability assessments and penetration testing to identify and address potential security weaknesses before they can be exploited.</p>
          
          <h2>Conclusion</h2>
          
          <p>Zero-day vulnerabilities represent a significant challenge in cybersecurity, but with a comprehensive security strategy, organizations can reduce their risk and minimize potential damage. By implementing multiple layers of protection and staying vigilant, you can better protect your systems even against unknown threats.</p>`,
          coverImage: "/unseen-threat.png",
          author: "John Doe",
          readTime: "8 min read",
        },
        {
          title: "Ransomware Protection Strategies",
          slug: "ransomware-protection-strategies",
          excerpt: "Effective strategies to prevent, detect, and recover from ransomware attacks.",
          content: `<p>Ransomware attacks continue to pose a significant threat to organizations of all sizes. This article outlines effective strategies to prevent, detect, and recover from ransomware attacks.</p>
          
          <h2>Understanding Ransomware</h2>
          
          <p>Ransomware is a type of malicious software that encrypts a victim's files. The attackers then demand a ransom from the victim to restore access to the data upon payment. Users are shown instructions for how to pay a fee to get the decryption key. The costs can range from a few hundred dollars to thousands, payable to cybercriminals in Bitcoin or other cryptocurrencies.</p>
          
          <h2>Prevention Strategies</h2>
          
          <h3>1. Regular Backups</h3>
          
          <p>Implement a robust backup strategy following the 3-2-1 rule: maintain at least three copies of your data, store two backup copies on different storage media, with one located offsite. Ensure backups are tested regularly and are not accessible from the networks they are backing up.</p>
          
          <h3>2. Security Awareness Training</h3>
          
          <p>Educate employees about phishing emails, suspicious websites, and other social engineering tactics. Regular training sessions and simulated phishing exercises can help reinforce security awareness.</p>
          
          <h3>3. Keep Systems Updated</h3>
          
          <p>Regularly update operating systems, applications, and firmware to patch known vulnerabilities that could be exploited by ransomware.</p>
          
          <h3>4. Email Security</h3>
          
          <p>Implement robust email security solutions that can detect and block phishing attempts and malicious attachments, which are common ransomware delivery methods.</p>
          
          <h3>5. Network Segmentation</h3>
          
          <p>Segment your network to limit lateral movement in case of a breach, preventing ransomware from spreading throughout your entire organization.</p>
          
          <h2>Detection Strategies</h2>
          
          <h3>1. Endpoint Detection and Response (EDR)</h3>
          
          <p>Deploy EDR solutions that can detect suspicious activities and potential ransomware behavior on endpoints.</p>
          
          <h3>2. Network Monitoring</h3>
          
          <p>Implement continuous network monitoring to detect unusual traffic patterns or communication with known malicious domains.</p>
          
          <h3>3. File Integrity Monitoring</h3>
          
          <p>Use file integrity monitoring tools to alert on unexpected file changes, which could indicate ransomware encryption activities.</p>
          
          <h2>Recovery Strategies</h2>
          
          <h3>1. Incident Response Plan</h3>
          
          <p>Develop and regularly test an incident response plan specifically for ransomware attacks, including isolation procedures, communication protocols, and recovery steps.</p>
          
          <h3>2. Offline Backups</h3>
          
          <p>Maintain offline backups that cannot be affected by ransomware, ensuring you can restore systems without paying the ransom.</p>
          
          <h3>3. Business Continuity Planning</h3>
          
          <p>Develop business continuity plans that allow critical operations to continue while recovery efforts are underway.</p>
          
          <h2>Conclusion</h2>
          
          <p>Ransomware attacks can be devastating, but with proper prevention, detection, and recovery strategies in place, organizations can significantly reduce their risk and minimize the impact of an attack. Remember that the best defense against ransomware is a proactive, multi-layered approach to security.</p>`,
          coverImage: "/digital-shield.png",
          author: "Jane Smith",
          readTime: "10 min read",
        },
        {
          title: "Securing Cloud Infrastructure",
          slug: "securing-cloud-infrastructure",
          excerpt: "Best practices for securing your cloud infrastructure and applications.",
          content: `<p>As organizations continue to migrate their infrastructure and applications to the cloud, securing these environments becomes increasingly critical. This article outlines best practices for securing your cloud infrastructure.</p>
          
          <h2>Understanding the Shared Responsibility Model</h2>
          
          <p>Cloud security operates on a shared responsibility model, where the cloud provider secures the underlying infrastructure, and you are responsible for securing your data, applications, and access controls. Understanding this division of responsibilities is crucial for implementing effective security measures.</p>
          
          <h2>Key Security Practices</h2>
          
          <h3>1. Identity and Access Management (IAM)</h3>
          
          <p>Implement strong IAM policies following the principle of least privilege. Use multi-factor authentication (MFA) for all accounts, especially those with administrative privileges. Regularly review and audit access permissions to ensure they remain appropriate.</p>
          
          <h3>2. Data Encryption</h3>
          
          <p>Encrypt data both in transit and at rest. Use strong encryption protocols and manage encryption keys securely. Consider using customer-managed keys where available for additional control.</p>
          
          <h3>3. Network Security</h3>
          
          <p>Implement network segmentation using virtual private clouds (VPCs), subnets, and security groups. Use firewalls, web application firewalls (WAFs), and intrusion detection/prevention systems to protect your network perimeter.</p>
          
          <h3>4. Security Monitoring and Logging</h3>
          
          <p>Enable comprehensive logging and monitoring across your cloud environment. Set up alerts for suspicious activities and regularly review logs for security incidents. Consider using cloud-native security information and event management (SIEM) solutions.</p>
          
          <h3>5. Vulnerability Management</h3>
          
          <p>Regularly scan your cloud infrastructure and applications for vulnerabilities. Implement a robust patch management process to address identified vulnerabilities promptly.</p>
          
          <h2>Cloud-Specific Security Considerations</h2>
          
          <h3>1. Container Security</h3>
          
          <p>If using containers, implement security measures specific to containerized environments, such as scanning container images for vulnerabilities, using minimal base images, and implementing runtime protection.</p>
          
          <h3>2. Serverless Security</h3>
          
          <p>For serverless architectures, focus on securing the application layer, managing dependencies, and implementing proper function permissions and API security.</p>
          
          <h3>3. Cloud Storage Security</h3>
          
          <p>Secure cloud storage buckets and blobs by implementing proper access controls, encryption, and versioning. Regularly audit storage configurations to prevent unauthorized access.</p>
          
          <h2>Compliance and Governance</h2>
          
          <p>Implement cloud governance policies to ensure compliance with relevant regulations and internal security standards. Use cloud security posture management (CSPM) tools to continuously assess your compliance status and identify potential security risks.</p>
          
          <h2>Conclusion</h2>
          
          <p>Securing cloud infrastructure requires a comprehensive approach that addresses identity management, data protection, network security, and continuous monitoring. By implementing these best practices and staying informed about emerging threats, you can maintain a secure cloud environment that protects your organization's valuable assets.</p>`,
          coverImage: "/secure-cloud-network.png",
          author: "Michael Chen",
          readTime: "12 min read",
        },
      ])
      console.log("✅ Sample blog posts added")
    } else {
      console.log("ℹ️ Blog posts table already has data, skipping sample data insertion")
    }

    console.log("✅ Migration completed successfully")
  } catch (error) {
    console.error("❌ Migration failed:", error)
  }
}

main()
