import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/models/User"

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const query: any = { plan: "premium" }; // Export only premium users
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
    query.plan = "premium"; // Keep premium filter
  }

  const users: any[] = (User as any).find ? await (User as any).find(query).sort({ createdAt: -1 }) : [];

  // Create CSV
  const header = "Name,Email,Plan,Chats,Status,Joined Date,Premium Until\n";
  const rows = users.map(u => 
    `"${u.name}","${u.email}","${u.plan}",${u.chats || 0},"${u.isBanned ? 'Banned' : 'Active'}","${new Date(u.createdAt).toLocaleDateString()}","${u.premiumUntil ? new Date(u.premiumUntil).toLocaleDateString() : '-'}"`
  ).join("\n");

  const csv = header + rows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="premium-users-${new Date().toISOString().slice(0,10)}.csv"`
    }
  });
}
